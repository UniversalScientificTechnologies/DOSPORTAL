
from .models import Record
from .helpers_cari import *

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

    record = Record.objects.filter(pk=pk)[0]

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

    if type(metadata) == str:
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





