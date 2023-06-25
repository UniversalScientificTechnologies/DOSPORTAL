from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
from .models import (DetectorManufacturer, measurement, 
                     record, Detector, DetectorType)

from django.shortcuts import get_object_or_404, redirect, render

from DOSPORTAL import models

import pandas as pd
import numpy as np
import matplotlib
from datetime import datetime, timedelta
import gpxpy
import json


import matplotlib.pyplot as plt
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import io


FIRST_CHANNEL = 10


def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")

class MeasurementsListView(generic.ListView):
    model = measurement
    context_object_name = 'measurements_list' 
    queryset = measurement.objects.filter()
    template_name = 'measurements/measurements_list.html' 


    def get_context_data(self, **kwargs):
        context = super(MeasurementsListView, self).get_context_data(**kwargs)
        context['some_data'] = 'This is just some data'
        return context


class RecordForm(forms.ModelForm):
    log_file = forms.FileField(
        required=False,
        widget=forms.widgets.FileInput(),
        label="Log file"
    )
    
    time_start = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={
            'type': "datetime-local",
            'class': 'form-control datetimepicker-input',
        })
    )

    class Meta:
        model = record
        exclude = ("time_end", "measurement", "log_filename")



class NewMeasurementForm(forms.ModelForm):

    name = forms.CharField(
        required=True,
        label = "Measurement name"
    )

    description = forms.CharField(
        required=False,
        label="Measurement description"   
    )

    public = forms.BooleanField(
        required=True,
        label = "Will be this log public?"
    )

    class Meta:
        model = measurement
        exclude = ("time_end", "measurement", 'author', 'time_start',
                   "location_file", 'base_location_lat', 'base_location_lon', 'base_location_alt')


def handle_uploaded_file(f, file):
    with open(file, "wb+") as destination:
        for chunk in f.chunks():
            destination.write(chunk)




def RecordNewView(request, pk):
    if request.method == "POST":
        print("POST... s formulářem :) ")
        form = RecordForm(request.POST, request.FILES)
        print(form)
        if form.is_valid():
            data = form.save(commit=False)
            data.author = request.user
            data.log_file= request.FILES['log_file']
            data.log_filename = request.FILES['log_file'].name.split("/")[-1]
            data.measurement = measurement.objects.get(pk=pk)
            handle_uploaded_file(request.FILES["log_file"], data.log_file.name)
            data.save()
        else:
            print("Form není validni")
            print(form.errors)
        
        return redirect("measurements")




def MeasurementDetailView(request, pk):
    #model = measurement
    ms = get_object_or_404(measurement, pk=pk)
    record_form = RecordForm()
    return render(request, 'measurements/measurement_detail.html', context={'measurement': ms, 'record_form': record_form})


def MeasurementNewView(request):

    if request.method == "POST":
        print("POST... s formulářem :) ")
        form = NewMeasurementForm(request.POST)
        print(form)
        if form.is_valid():
            data = form.save(commit=False)
            data.author = request.user
            data.save()
            return redirect("measurements")


    return render(request, 'measurements/measurement_new.html',
                  context={'form': NewMeasurementForm() })



def MeasurementDataView(request, pk):
    if request.method == "GET":
        print(pk)
        print("MAM GET... ")

        a=measurement.objects.get(pk=pk)
        rec=record.objects.filter(measurement=pk, record_type="S")
        loc=record.objects.filter(measurement=pk, record_type="L")


        #return HttpResponse(a)
        return render(request, 'measurements/measurement_view_data.html', context={'record': a })
    



def measuredDataGet(request, pk):

    series = []
    a=measurement.objects.get(pk=pk)
    rec=record.objects.filter(measurement=pk, record_type="S")
    loc=record.objects.filter(measurement=pk, record_type="L")


    for i, b in enumerate(rec):

        l=[]
        l.extend(range(0,505))

        s = {
            'name': "Evolution_"+str(i)+"_avg",
            'type': 'line',
            'data': [],
            'showSymbol': False,
            #'xAxisIndex': 1,
            'yAxisIndex': 1,
        }


        s2 = {
            'name': "Evolution_"+str(i),
            'type': 'scatter',
            'data': [],
            'symbolSize': 3,
            'itemStyle': {
                'opacity': 0.4
            },
        }

        df = pd.read_csv(b.log_file, sep=',', header=None, names=l, comment='*', low_memory=False)
        df = df.reset_index(drop=True)

        LAST_CHANNEL = len(df. columns)

        df[2] = df[2].apply(pd.to_numeric, errors='coerce')

        df['runtime'] = np.nan
        df.loc[df[0]=='$HIST','seconds'] = df.loc[df[0]=='$HIST',2]
        df.loc[df[0]=='$DOS','seconds'] = 0
        df['runtime'] = df['seconds'].diff() * -1
        df = df.copy()

        run = 0
        df['run'] = np.nan
        df['run'].fillna(method="ffill", inplace=True)

        df[2] = pd.to_numeric(df[2])
        df['time'] = b.time_start + pd.to_timedelta(df[2], unit='s')
        df.set_index(df['time'], drop=False, inplace=True)


        #cmap = matplotlib.cm.get_cmap('tab10')
        #color = cmap(i/len(rec))
        
        #df = data[x]['df']
        df['sum'] = df[range(FIRST_CHANNEL,LAST_CHANNEL)].sum(axis=1)/10/2
        #df['sum'] = df[range(FIRST_CHANNEL,LAST_CHANNEL)].sum(axis=1)

        df['sum_f'] = df['sum'].rolling(15).mean()

        sd = df['sum_f'].copy().dropna()
        s['data'] = list(zip(sd.index, sd))

        sd2 = df['sum'].copy().dropna()
        s2['data'] = list(zip(sd2.index, sd2))

        print(s['data'])

        series.append(s)
        series.append(s2)
    
    for i, l in enumerate(loc):
        if 'gpx' in l.log_filename:
            print("Nacitam GPX..")
            print(l.log_file)
            gpx_file = open(str(l.log_file), 'r')
            gpx = gpxpy.parse(gpx_file)

            #df = pd.DataFrame(columns=['lon', 'lat', 'alt', 'time'])
            df = pd.DataFrame(columns=['lon', 'lat', 'alt', 'time'])
            for segment in gpx.tracks[0].segments:
                data = segment.points
                for point in data:
                    df.loc[len(df)] = pd.Series({'lon': point.longitude, 'lat' : point.latitude, 'alt' : point.elevation, 'time' : point.time})

            df = df.sort_values(by='time')
            df.set_index(df['time'], drop=False, inplace=True)
            #df = df.reset_index()

            df = df.fillna(method='ffill')
            df = df.fillna(method='bfill')

            s = {
                'name': "Altitude_"+str(i),
                'type': 'line',
                'data': list(zip(df.index, df['alt']*0.001)),
                'symbolSize': 3,
                'itemStyle': {
                    'opacity': 0.4
                },
                'yAxisIndex': 1,
            }

            series.append(s)
            

        elif '.csv' in l.log_filename:
            df = pd.read_csv(l.log_file)
            df['UTC'] = pd.to_datetime(df['UTC'])
            df = df.sort_values(by='UTC')
            df.set_index(df['UTC'], drop=True, inplace=True)

            print(df)

            s = {
                'name': "Altitude_"+str(i),
                'type': 'line',
                'data': list(zip(df.index, df['Altitude']*0.0003048)),
                'symbolSize': 3,
                'itemStyle': {
                    'opacity': 0.4
                },
                'yAxisIndex': 1,
            }

            series.append(s)


    return JsonResponse(series, safe=False)


def measuredSpectraGet(request, pk):

    series = []
    a=measurement.objects.get(pk=pk)

    part_from = int(float(request.GET.get('start', 0)))  
    part_to = int(float(request.GET.get('end', 0)))    

    rec=record.objects.filter(measurement=pk, record_type="S")
    #loc=record.objects.filter(measurement=pk, record_type="L")

    l=[]
    l.extend(range(0,505))

    spc = []

    for i, b in enumerate(rec):

        df = pd.read_csv(b.log_file, sep=',', header=None, names=l, comment='*', low_memory=False)
        df = df.reset_index(drop=True)

        LAST_CHANNEL = len(df. columns)


        df[2] = df[2].apply(pd.to_numeric, errors='coerce')

        df['runtime'] = np.nan
        df.loc[df[0]=='$HIST','seconds'] = df.loc[df[0]=='$HIST',2]
        df.loc[df[0]=='$DOS','seconds'] = 0
        df['runtime'] = df['seconds'].diff() * -1

        run = 0
        df['run'] = np.nan
        df['run'].fillna(method="ffill", inplace=True)

        df[2] = pd.to_numeric(df[2])
        df['time'] = b.time_start + pd.to_timedelta(df[2], unit='s')


        if part_from>10 and part_to>10:
            print("BUDE OREZ DAT...")
            print(part_from, part_to)

            start_date =  pd.to_datetime(datetime.utcfromtimestamp(part_from), utc=True)
            end_date =  pd.to_datetime(datetime.utcfromtimestamp(part_to), utc=True)
            
            print(start_date, end_date)
            
            df = df.loc[ ((df['time']) >= start_date)
                    & ((df['time']) < end_date) ]

        df.set_index(df['time'], drop=False, inplace=True)


        ener = df.iloc[:,FIRST_CHANNEL:LAST_CHANNEL].sum().reset_index()[0]
        spc.append(ener.to_dict())
        #print(ener)

        # coef3 = np.array([0.,0.])
        # coef3[1] = 0.016
        # coef3[0] = 0.034

        # print (coef3[0], coef3[1])

        # e3 = pd.DataFrame()
        # e3['1'] = ener
        # e3['i'] = ener.index
        # e3['x'] = (e3['i'].astype(float)-FIRST_CHANNEL) * coef3[1] + coef3[0]

    return JsonResponse(spc, safe=False)



def measurementGetData(request, pk):

    a=measurement.objects.get(pk=pk)
    rec=record.objects.filter(measurement=pk, record_type="S")
    loc=record.objects.filter(measurement=pk, record_type="L")