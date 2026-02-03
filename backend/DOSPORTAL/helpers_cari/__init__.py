
import os
import sys
import csv
import time
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import datetime




# Definition of indexes used in CARI - dictionaries
radiation_dict = {'total':0, 'neutrons':1, 'photons':2, 'electrons':3, 'positrons':4, 'neg_muons':5, 'pos_muons':6, 'protons':7, 'alphas':13}
tally_dict = {'flux':1, 'icrp103':2, 'icrp60':3, 'h10':4, 'whole_dose':5, 'Si_500um':6, 'Si_300um':7, 'NM64':8}

def make_string(row, tally, radiation):
    ''' -------------------------- PREPARES A STRING FOR THE CARI7 INPUT FILE --------------------------- '''
    ''' Input data format - Latitude [xx.xxxx], longitude [yyy.yyyy], Altitude [m], UTC [datetime object] '''
    ''' Output example - N, 50.4234, E, 15.8240, K, 11.87, 2017/11/29, H11, D7, P6, C4, S0                '''
    ''' ------------------------------------------------------------------------------------------------- '''
    
    latitude_dir = 'N'
    longitude_dir = 'E'
    if row['Latitude'] < 0:
        latitude_dir = 'S'
    if row['Longitude'] < 0:
        longitude_dir = 'W'

    print(">>>", row)
        
    latitude = str(abs(row['Latitude'])) 
    longitude = str(abs(row['Longitude']))
    altitude = str(round(row['Altitude'] * 0.001, 3)) # kilometers
    time_str_formatted = row['UTC'].strftime('%Y/%m/%d') # YYYY/MM/DD
    
    out_str = latitude_dir + ', ' + latitude + ', ' + longitude_dir + ', ' +  latitude + ', K, ' + altitude + ', ' + time_str_formatted + ', H' + str(row['UTC'].hour) + ', D' + str(tally_dict[tally]) + ', P' + str(radiation_dict[radiation]) + ', C4, S0\n'
    return out_str

def create_cari_input(df, tally, radiation, filename):
    df_str = df.apply(make_string, axis=1, args=(tally, radiation))
    data = list(df_str.to_numpy())
    #print(data)
    f = open(filename, 'w')
    f.write('START-------------------------------------------------')
    f.write('\n')
    f.writelines(data)
    f.write('STOP--------------------------------------------------------')
    f.close()
    
def read_flight_radar_data(filename):
    ''' -------------------------- READS FLIGHT RADAR DATA AND PREPROCESS THEM -------------------------- '''
    ''' Input data format - Timestamp, UTC, Callsign, Position, Altitude, Speed, Direction                '''
    ''' ------------------------------------------------------------------------------------------------- '''
    
    df = pd.read_csv(filename, sep=',')
    df['UTC'] = pd.to_datetime(df['UTC'], format='%Y-%m-%dT%H:%M:%S', errors='coerce')
    df['Position'] = df['Position'].str.split(',')
    df['Latitude'] = df['Position'].str[0].astype(float)
    df['Longitude'] = df['Position'].str[1].astype(float)
    df['Latitude'] = df['Latitude'].round(4)
    df['Longitude'] = df['Longitude'].round(4)
    df['Altitude'] = df['Altitude'] * 0.3048 # conversion from feet to meters
    return df
    
def run_cari(input_file):
    change_input = "sed -i \'5 c\\" + input_file + "' DEFAULT.INP"
    os.system(change_input)
    os.system('cari7a')



def calculate_cari():
    
    radiation_list = ['total', 'neutrons', 'photons', 'electrons', 'positrons', 'neg_muons', 'pos_muons', 'protons', 'alphas']
    tally_list = ['flux', 'icrp103', 'h10', 'Si_300um', 'Si_500um']

    radiation_list = ['total']
    tally_list = ['flux']

    flight_radar_file = '/storage/experiments/2023/04_HIMAC/NRT_WAW_PRG/LO80_3008d15a.csv'

    df = read_flight_radar_data(flight_radar_file)

    for radiation in radiation_list:
        for tally in tally_list:
            filename = radiation + '_' + tally + '.LOC'
            create_cari_input(df, tally, radiation, filename)
            run_cari(filename)
