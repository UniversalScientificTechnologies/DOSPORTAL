
from .models import File
from .models.spectrals import SpectralRecord, SpectralRecordArtifact
from .helpers_cari import create_cari_input
from django.core.files.base import ContentFile
import io
import os
import numpy as np
import pandas as pd
import json


def process_flight_entry(Flight):
    print("FLIGHT:", Flight)

    ## CARI PART 

    folder = 'data/cari/{}/cari'.format(Flight.id)

    if not os.path.exists(folder):
        os.makedirs(folder)
    os.system('unzip -o data/cari7a.zip -d {}'.format(folder))


    df = pd.read_csv(Flight.trajectory_file, sep=',')
    print("Nacteny DF", df)
    df['UTC'] = pd.to_datetime(df['UTC'])
    df['Position'] = df['Position'].str.split(',')
    df['Latitude'] = df['Position'].str[0].astype(float)
    df['Longitude'] = df['Position'].str[1].astype(float)
    df['Latitude'] = df['Latitude'].round(4)
    df['Longitude'] = df['Longitude'].round(4)
    df['Altitude'] = df['Altitude'] * 0.3048 # conversion from feet to meters

    radiation_list = ['total', 'neutrons', 'photons', 'electrons', 'positrons', 'neg_muons', 'pos_muons', 'protons', 'alphas']
    tally_list = ['flux', 'icrp103', 'h10', 'Si_300um', 'Si_500um']

    radiation_list = ['total']
    tally_list = ['flux']

    for radiation in radiation_list:
        for tally in tally_list:
            filename = folder + '/' + radiation + '_' + tally + '.LOC'
            print("BUDU POCITAT CARI.. ", tally, radiation, filename)
            print(df)
            create_cari_input(df, tally, radiation, filename)
            #run_cari(filename)

            

def process_record_entry(pk):

    print("DOSPORTAL PROCESS_RECORD_ENTRY", pk)
    print(">.... django-Q ")

    record = File.objects.filter(pk=pk)[0]

    print(record)

    start_time = record.time_of_interest_start
    end_time = record.time_of_interest_end
    duration_hours = (end_time - start_time) / 3600


    df = pd.read_pickle(record.data_file.path)
    print(df)
    df = df[(df['time'] >= start_time) & (df['time'] <= end_time)]
    df = df.drop('time', axis=1).astype(float).to_numpy()

    calib = record.calib

    s = np.linspace(0, df.shape[1]-1, df.shape[1])
    s = calib.coef0 + s * calib.coef1

    dose_rate_per_exposition = (((1e6 * (1.602e-19 * np.matmul(df, s))/0.1165e-3)/10) * 3600) # in uGy/h
    
    dose_rate = dose_rate_per_exposition.mean()
    
    # TODO get detector chip parameters
    # e_corr = df['energy_sum'].mean() # eV 
    # si_mass = 0.1165e-3 # kg
    # integration = 10 # s

    metadata = record.metadata

    print('METADATA FILE', metadata)
    print(type(metadata))

    if isinstance(metadata, str):
        metadata = json.loads(metadata)

    if 'outputs' not in metadata:
        metadata["outputs"] = {}

    metadata["outputs"]["dose_rate_mean"] = dose_rate_per_exposition.mean()
    metadata["outputs"]["dose_rate_std"] = dose_rate_per_exposition.std()
    metadata["outputs"]["dose_obtained"] = dose_rate_per_exposition.mean() * duration_hours

    #record.metadata = json.dumps(metadata, indent=4)
    record.metadata = metadata
    record.save()

    return dose_rate


def process_spectral_record_into_spectral_file_async(spectral_record_id):
    
    print(f"creating spectral record artifact of type: {SpectralRecordArtifact.SPECTRAL_FILE}")
    
    def get_candy_line_lenght(file_obj):
        file_obj.seek(0)
        candy_line = None

        for line in file_obj:
            decoded = line.decode("utf-8").strip()
            if decoded.startswith("$CANDY"):
                candy_line = decoded
                break

        if candy_line is None:
            raise ValueError("No $CANDY row found in file")

        num_columns = len(candy_line.split(","))
        file_obj.seek(0)

        return num_columns

    try:
        record = SpectralRecord.objects.get(id=spectral_record_id)
        print(f"Processing SpectralRecord {record.id}")
        
        record.processing_status = SpectralRecord.PROCESSING_IN_PROGRESS
        record.save(update_fields=['processing_status'])
        
        # Get raw file
        if not record.raw_file or record.raw_file.file_type != File.FILE_TYPE_LOG:
            raise ValueError("No valid raw log file found")
        
        print(f"Processing file from S3: {record.raw_file.filename}")
        
        num_columns = get_candy_line_lenght(record.raw_file.file)

        df_log_raw = pd.read_csv(
            record.raw_file.file,
            sep=',',
            header=None,
            names=range(num_columns),
            on_bad_lines='skip'
        )
        
        record.raw_file.file.close()
        
        print(f"Loaded {len(df_log_raw)} rows from S3")
        
        df_candy = df_log_raw[df_log_raw[0] == '$CANDY']
        
        print(f"df_candy: {df_candy}")

        if df_candy.empty:
            raise ValueError("No $CANDY data found in log file")
            
        print(f"Found {len(df_candy)} CANDY entries")
        
        # Extract data
        time_col = df_candy[2].astype(float)
        particle_col = df_candy[3].astype(float)
        spectrum_channels = df_candy.iloc[:, 10:].fillna(0).astype(int)
        
        df_to_save = pd.DataFrame({
            'id': range(len(df_candy)),
            'time_ms': time_col.values,
            'particle_count': particle_col.values
        })
        
        # Add spectrum channels as columns
        channel_names = [f'channel_{i}' for i in spectrum_channels.columns]
        spectrum_channels.columns = channel_names
        df_to_save = pd.concat([df_to_save, spectrum_channels], axis=1)
        
        # Normalize time to start from 0
        df_to_save['time_ms'] = df_to_save['time_ms'] - df_to_save['time_ms'].min()
        
        print(f"Created wide DataFrame: {df_to_save.shape[0]} records x {df_to_save.shape[1]} columns")
        print(f"Time range: {df_to_save['time_ms'].min():.1f} - {df_to_save['time_ms'].max():.1f} ms")
        print(f"Channels: {len(channel_names)}")
        
        # Save as Parquet
        parquet_buffer = io.BytesIO()
        df_to_save.to_parquet(parquet_buffer, engine='fastparquet', index=False)
        parquet_buffer.seek(0)
        
        # Create File instance for Parquet
        spectral_file = File.objects.create(
            filename=f"spectral_{record.id}.parquet",
            file_type=File.FILE_TYPE_PARQUET,
            source_type="generated",
            author=None,  # System generated
            owner=record.owner,
            metadata={
                'source_record_id': str(record.id),
                'data_type': 'spectral_parquet_wide',
                'records_count': len(df_to_save),
                'channels_count': len(channel_names),
                'time_range_ms': [float(df_to_save['time_ms'].min()), float(df_to_save['time_ms'].max())],
                'channel_columns': channel_names
            }
        )
        
        spectral_file.file.save(
            f"spectral_{record.id}.parquet",
            ContentFile(parquet_buffer.read()),
            save=True
        )
        
        print(f"Parquet file saved to S3: {spectral_file.file.name}")
        
        SpectralRecordArtifact.objects.create(
            spectral_record=record,
            artifact=spectral_file,
            artifact_type=SpectralRecordArtifact.SPECTRAL_FILE
        )
        
        record.processing_status = SpectralRecord.PROCESSING_COMPLETED
        record.save(update_fields=['processing_status'])
        
        print(f"SpectralRecord {record.id} processed successfully - Parquet artifact created: {spectral_file.id}")
        
    except Exception as e:
        import traceback
        print(f"Error processing SpectralRecord {spectral_record_id}: {str(e)}")
        print(traceback.format_exc())
        
        try:
            record = SpectralRecord.objects.get(id=spectral_record_id)
            record.processing_status = SpectralRecord.PROCESSING_FAILED
            record.metadata = record.metadata or {}
            record.metadata['processing_error'] = str(e)
            record.save(update_fields=['processing_status', 'metadata'])
        except:
            pass  # Record might not exist; me atm: *_*
        
        raise





