from django.db.models.signals import post_save 
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Profile, Record, SpectrumData, Detector
import json
import pandas as pd
import datetime

from django_q.tasks import async_task


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    instance.profile.save()



@receiver(post_save, sender=Record)
def save_record(sender, instance, created = None, **kwargs):

    if created:
        filepath = instance.log_file.path
        print(filepath)

        metadata = json.loads(instance.metadata) if instance.metadata else {}

        if type(metadata) is not dict:
            metadata = {}

        
        metadata['log_device_info'] = {}
        metadata['log_runs_count'] = 0

        max_size = 0

        with open(filepath, 'r') as file:
            for line in file:
                parts_size = len(line.split(","))
                if parts_size > max_size: max_size = parts_size

                if line.startswith("$HIST"):
                    parts = line.split(",")
                    # spec_mod = SpectrumData()
                    # spec_mod.record = instance
                    # spec_mod.spectrum = parts[8:]
                    # spec_mod.integration = 10
                    # spec_mod.time = parts[2]
                    # spec_mod.save()
                    
                elif line.startswith("$DOS"):
                    print("DOS", line)
                    metadata['log_runs_count'] += 1
                    parts = line.split(",")
                    metadata['log_device_info']['DOS'] = {
                        "type": parts[0],
                        "hw-model": parts[1],
                        "fw-version": parts[2],
                        "fw-build_info": parts[5],
                        "fw-commit": parts[4],
                        'hw-sn': parts[6].strip()
                    }
                    
                elif line.startswith("$DIG"):
                    print("DIG", line)
                    parts = line.split(",")
                    metadata['log_device_info']['DIG'] = {
                        "type": parts[0],
                        "hw-model": parts[1],
                        "hw-sn": parts[2],
                        'eeprom': parts[3].strip()
                    }
                    
                elif line.startswith("$ADC"):
                    print("ADC", line)
                    parts = line.split(",")
                    metadata['log_device_info']['ADC'] = {
                        "type": parts[0],
                        "hw-model": parts[1],
                        "hw-sn": parts[2],
                        'eeprom': parts[3].strip()
                    }
        
        df_log = pd.read_csv(instance.log_file.path, sep = ',', header = None, names=range(max_size))

        data_types = df_log[0].unique().tolist()

        df_spectrum = df_log [df_log[0] == '$HIST'] 
        df_spectrum = df_spectrum.drop(columns=[0, 1, 3, 4, 5, 6, 7])

        new_columns = ['time'] + list(range(df_spectrum.shape[1] - 1))
        df_spectrum.columns = new_columns

        df_spectrum['time'] = df_spectrum['time'].astype(float)
        duration = df_spectrum['time'].max() - df_spectrum['time'].min()

        metadata['log_info'] = {}
        metadata['log_info']['internat_time_min'] = df_spectrum['time'].min()
        metadata['log_info']['internat_time_max'] = df_spectrum['time'].max()
        metadata['log_info']['log_duration'] = float(duration)
        metadata['log_info']['spectral_count'] = df_spectrum.shape[0]
        metadata['log_info']['channels'] = df_spectrum.shape[1] - 1 # remove time column
        metadata['log_info']['types'] = data_types

        df_spectrum['time'] = df_spectrum['time'] - df_spectrum['time'].min()
        instance.record_duration = datetime.timedelta(seconds=float(duration))

        new_name = instance.user_directory_path_data('pk')
        df_spectrum.to_pickle('data/media/'+new_name)

        del df_spectrum

        instance.data_file.name = new_name

        try:
            sn = metadata['log_device_info']['DOS']['hw-sn']
            print("Traying to find detector with SN", sn)
            det = Detector.objects.get(sn=sn)
            print("Found detector", det)
            instance.detector = det

            instance.calib = det.calib.last()


        except Exception as e:
            print(e)

        df_metadata = pd.DataFrame()
        
        try:
            for index, row in df_log.iterrows():
                first_column_value = row[0]
                row_as_list = row.tolist()[2:]
                
                match first_column_value:
                    case '$BATT':
                        keys = ['time', 'voltage', 'current', 'capacity_remaining', 'capacity_full', 'temperature']
                        bat = { k:float(v) for (k,v) in zip(keys, row_as_list[0:len(keys)])}
                        #bat['current'] /= 1000.0
                        #bat['voltage'] /= 1000.0
                        df_metadata = pd.concat([df_metadata, pd.DataFrame([bat])], ignore_index=True)
                        del bat
                    case '$ENV':
                        keys = ['time', 'temperature_0', 'humidity_0', 'temperature_1', 'humidity_1', 'temperature_2', 'pressure_3']
                        env = { k:float(v) for (k,v) in zip(keys, row_as_list[0:len(keys)])}
                        df_metadata = pd.concat([df_metadata, pd.DataFrame([env])], ignore_index=True)
                        del env
                    case '$HIST':
                        pass
                    case _:
                        print('Unknown row', first_column_value)
            
            print(df_metadata)
            
            df_metadata = df_metadata.sort_values(by=['time']).reset_index(drop=True)
            df_metadata['time'] -= metadata['log_info']['internat_time_min']
            new_name = instance.user_directory_path_data('metadata.pk')
            instance.metadata_file.name = new_name
            print("NAME", new_name)
            print(instance.metadata_file)
            df_metadata.to_pickle('data/media/'+new_name)

        except Exception as e:
            print(e)


        print(instance.data_file)
                    
        instance.metadata = json.dumps(metadata)
        instance.save()

        async_task('DOSPORTAL.tasks.process_record_entry', instance.pk)

        return 0
