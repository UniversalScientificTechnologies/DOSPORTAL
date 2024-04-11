import math
from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
import numpy as np
from .models import (DetectorManufacturer, measurement, Record, 
                     Detector, DetectorType, DetectorLogbook)
from .forms import DetectorLogblogForm
import os
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect, render

from DOSPORTAL import models
import json

from django.views import generic
from django.views.generic import ListView

from django_filters.views import FilterView
from django_tables2.views import SingleTableMixin, SingleTableView
import django_tables2 as tables
from django_tables2.utils import Accessor
from django_tables2 import RequestConfig
from django_tables2.utils import A  # alias for Accessor
from django.utils.html import format_html
from django.urls import reverse

from django_q.tasks import async_task

import itertools

import pandas as pd

from .forms import RecordForm


FIRST_CHANNEL = 10

# class RecordsListView(generic.ListView):
#     model = Record
#     context_object_name = 'records_list' 
#     queryset = Record.objects.all()
#     template_name = 'records/records_list.html' 

#     def get_context_data(self, **kwargs):
#         context = super().get_context_data(**kwargs)
#         return context



class RecordTable(tables.Table):
    row_number = tables.Column(empty_values=(), verbose_name='#')

    link = tables.LinkColumn(
                    'record-view',
                    args=[tables.A('pk')],
                    verbose_name='Name',
                    attrs={ 'aria-label': 'Link'},
                    text = lambda record: record.name,
                )

    class Meta:
        model = Record
        fields = ("row_number", "link", "belongs", "author", "data_policy", "log_original_filename")  # replace with your field names

    def render_row_number(self, record):
        self.row_number = getattr(self, 'row_number', itertools.count(self.page.start_index()))
        return format_html('<a href="{}">{}</a>', reverse('record-view', args=[record.pk]), next(self.row_number))


def RecordsListView(request):
    table = RecordTable(Record.objects.all(), order_by = 'created',  
        template_name="django_tables2/bootstrap5-responsive.html")

    table.paginate(page=request.GET.get("page", 1), per_page=25)

    return render(request, "records/records_list.html", {
        "table": table
    })



def handle_uploaded_file(f, file):
    print("Ukládám soubor " + file)
    with open(file, "wb+") as destination:
        for chunk in f.chunks():
            destination.write(chunk)
    print("ukladani souboru hotovo")


def obtain_parameters_from_log(file):

    f = open(file)
    line_1 = f.readline().rstrip().split(',')
    record_metadata = {}
    record_metadata['detector'] = dict(zip(['DET', 'detector_type', 'firmware_build', 'channels', 'firmware_commit', 'firmware_origin', 'detector_sn'], line_1))

    time_start = 0
    stop_stop = 0
    while True:
        line = f.readline()
        if line.startswith('$HIST'):
            line = line.rstrip().split(',')
            time_start = float(line[2])
            break
    i = -1
    flen = len(f.readlines())
    while True:
        f.seek(flen+i)
        line = f.readline()
        if line.startswith('$HIST'):
            line = line.rstrip().split(',')
            time_stop = float(line[2])
            count = int(line[1])
            break
        i -= 1
    
    record_metadata['record'] = {}
    record_metadata['record'] = {
        'duration': time_stop - time_start,
        'count': count
    }


    f.close()
    return record_metadata

def RecordNewView(request):
    if request.method == "POST":
        print("POST... s formulářem :) ")
        form = RecordForm(request.POST, request.FILES)
        
        if form.is_valid():
            data = form.save(commit=False)
            data.author = request.user
            data.log_file = request.FILES['log_file']

            #request.FILES['log_file'].save()
            
            data.log_original_filename = data.log_file.name

            print("LOG FILE PATH", data.log_file.path)
            print("LOG FILE NAME", data.log_file.name)

            # Get the original file name
            original_file_name = data.log_file.name

            # Create a new file name
            new_file_name = "new_" + original_file_name
            
            new_file_name = data.pk
            new_file_path = os.path.join(settings.MEDIA_ROOT, 'user_records', str(data.pk) )

            # Update the file name and path
            #data.log_file.name = new_file_name
            #data.log_file.path = new_file_path

            # handle_uploaded_file(request.FILES['log_file'], new_file_path)
            # try:
            #     metadata = obtain_parameters_from_log(new_file_path)
            # except:
            #     metadata = None
            
            # #handle_uploaded_file(request.FILES['log_file'], data.log_file.path)
            # #metadata = obtain_parameters_from_log(data.log_file.path)
            # print("Medatada z logu")
            # print(metadata)
            # if metadata:
            #     detector_pk = Detector.objects.get(sn=metadata['detector']['detector_sn'])
            #     if detector_pk:
            #         data.detector = detector_pk
            #     data.metadata = metadata
            #     data.record_duration = timedelta(seconds = metadata['record']['duration'])
            # #data.measurement = measurement.objects.get(pk=pk)
            pk = data.pk
            data.author = request.user

            #print(data)
            data.save()

            return redirect("record-view", pk=pk)    
            
        else:
            print("Form neni validni")
            print(form.errors)
            return render(request, 'records/record_new.html', {'form': form})
    
    else:
        form = RecordForm()
        return render(request, 'records/record_new.html', {'form': form})

def RecordView(request, pk):
    rec = Record.objects.get(pk=pk)

    outputs = json.loads(rec.metadata).get('outputs', {})
    return render(request, 'records/record_detail.html', context={'record': rec, 'outputs': outputs})


def GetSpectrum(request, pk):

    minEnergy = request.GET.get('minEnergy', 'nan') # nan string je tu z duvodu, ze to je vychozi hodnota v js
    maxEnergy = request.GET.get('maxEnergy', 'nan')
    logarithm = request.GET.get('logarithm', 'false') == 'true'


    record = Record.objects.filter(pk=pk)
    df = pd.read_pickle(record[0].data_file.path)
    
    # if not (minEnergy != 'nan' and maxEnergy != 'nan'):
    #     minEnergy = float(minEnergy)
    #     maxEnergy = float(maxEnergy)
    #     df = df[(df['energy'] > minEnergy) & (df['energy'] < maxEnergy)]
    
    total_time = df['time'].max()-df['time'].min()
    sums_list = df.drop('time', axis=1).sum().to_frame('counts').div(total_time)
    
    if logarithm:
        sums_list['counts'] = np.log10(sums_list['counts']+10)-0.9
        pass


    sums_list['channel'] = sums_list.index

    if record[0].calib:
        sums_list['channel'] = (record[0].calib.coef0 +  sums_list['channel'] * record[0].calib.coef1)/1000
    

    sums_list = sums_list[['channel', 'counts']].apply(tuple, axis=1).tolist()
    

    return JsonResponse({'spectrum_values': sums_list, 'total_time': total_time, 'calib': bool(record[0].calib)})



def GetEvolution(request, pk):

    minTime = request.GET.get('minTime', 'nan') # nan string je tu z duvodu, ze to je vychozi hodnota v js
    maxTime = request.GET.get('maxTime', 'nan')
    logarithm = request.GET.get('logarithm', 'false') == 'true'

    record = Record.objects.filter(pk=pk)
    df = pd.read_pickle(record[0].data_file.path)

    df['time'] = df['time'].astype(float)

    if record[0].time_tracked:
        start_time = record[0].time_start.timestamp()*1000
    else:
        start_time = 0
    
    print(start_time)


    if not (minTime != 'nan' and maxTime != 'nan'):
        minTime = (float(minTime)/1000-start_time)
        maxTime = (float(maxTime)/1000-start_time)
        df = df[(df['time'] >= minTime) & (df['time'] <= maxTime)]

    total_time = df['time'].max()-df['time'].min()

    time = df['time'].astype(float).mul(1000).add(start_time)
    sums = df.drop('time', axis=1).sum(axis=1).div(total_time)

    if logarithm:
        sums = np.log(sums+10)-0.9

    data = pd.DataFrame({'time': time, 'value': sums})

    data_list = data[['time', 'value']].apply(tuple, axis=1).tolist()


    time_of_interest = None
    if record[0].time_of_interest_start and record[0].time_of_interest_end:
        time_of_interest = []
        time_of_interest.append(record[0].time_of_interest_start*1000 + start_time)
        time_of_interest.append(record[0].time_of_interest_end*1000 + start_time)

    return JsonResponse({'evolution_values': data_list, 'time_tracked': record[0].time_tracked, 'time_of_interest': time_of_interest})  

def GetHistogram(request, pk):

    record = Record.objects.filter(pk=pk)
    df = pd.read_pickle(record[0].data_file.path).drop('time', axis=1)

    #print(df)

    data_list = []
    for row in df.iterrows():
        for column in df.columns:
            data_list.append([column, row[0], row[1][column]])

    return JsonResponse({'histogram_values': data_list[1:]})


def GetTelemetry(request, pk):

    record = Record.objects.filter(pk=pk)
    df = pd.read_pickle(record[0].metadata_file.path).drop('time', axis=1)
    df = df.astype(float)


    return JsonResponse({'telemetry_values': df.to_dict() })



def CalcDSI(request, pk):

#    record = Record.objects.filter(pk=pk)
#     df = pd.read_pickle(record[0].data_file.path).drop('time', axis=1).astype(float).to_numpy()

#     calib = record[0].calib

#     s = np.linspace(0, df.shape[1]-1, df.shape[1])
#     s = calib.coef0 + s * calib.coef1

#     energies_per_exposition = np.matmul(df, s)

#     dose_rate_per_exposition = ((1e6 * (1.602e-19 * energies_per_exposition)/0.1165e-3)/10) * 3600 # in uGy/h
#     dose_rate = dose_rate_per_exposition.mean()

#    # e_corr = df['energy_sum'].mean() # eV 
#     si_mass = 0.1165e-3 # kg
#     integration = 10 # s

#     return HttpResponse(f"Dose rate: {dose_rate} \n  \n" + str(df), content_type="text/csv")


    t = async_task('DOSPORTAL.tasks.process_record_entry', pk)


    return HttpResponse(f"Done {t}")