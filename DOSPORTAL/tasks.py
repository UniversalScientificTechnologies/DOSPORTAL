
from time import sleep
from .models import *
from .helpers_cari import *

import os
import sys
import csv
import time
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import datetime


import os

def process_flight_entry(Flight):
    print(Flight)

    ## CARI PART 

    folder = '/tmp/{}/cari'.format(Flight.id)

    if not os.path.exists(folder):
        os.makedirs(folder)
    os.system('unzip data/cari7a.zip -d {}'.format(folder))


    df = pd.read_csv(Flight.trajectory_file, sep=',')
    df['UTC'] = pd.to_datetime(df['UTC'], format='%Y-%m-%dT%H:%M:%S', errors='coerce')
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
            create_cari_input(df, tally, radiation, filename)
            #run_cari(filename)

            

