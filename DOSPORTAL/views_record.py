from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
from .models import (DetectorManufacturer, measurement, Record, 
                     Detector, DetectorType, DetectorLogbook)
from .forms import DetectorLogblogForm
import os
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect, render

from DOSPORTAL import models

from django.views import generic
from django.views.generic import ListView

from django_filters.views import FilterView
from django_tables2.views import SingleTableMixin, SingleTableView
import django_tables2 as tables
from django_tables2.utils import Accessor
from django_tables2 import RequestConfig
from django.utils.html import format_html
from django.urls import reverse


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
    link = tables.LinkColumn('record-view', args=[tables.A('pk')], verbose_name='Link', accessor='pk', attrs={'a': {'target': '_blank'}})

    class Meta:
        model = Record
        fields = ("row_number", "belongs", "author", "data_policy", "log_original_filename")  # replace with your field names

    def render_row_number(self, record):
        self.row_number = getattr(self, 'row_number', itertools.count(self.page.start_index()))
        return format_html('<a href="{}">{}</a>', reverse('record-view', args=[record.pk]), next(self.row_number))



def RecordsListView(request):
    table = RecordTable(Record.objects.all(), 
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
    return render(request, 'records/record_detail.html', context={'record': rec})


def GetSpectrum(request, pk):

    minEnergy = request.GET.get('minEnergy', 'nan') # nan string je tu z duvodu, ze to je vychozi hodnota v js
    maxEnergy = request.GET.get('maxEnergy', 'nan')

    #print("Get Spectrum", pk)

    record = Record.objects.filter(pk=pk)
    df = pd.read_pickle(record[0].data_file.path)
    
    # if not (minEnergy != 'nan' and maxEnergy != 'nan'):
    #     minEnergy = float(minEnergy)
    #     maxEnergy = float(maxEnergy)
    #     df = df[(df['energy'] > minEnergy) & (df['energy'] < maxEnergy)]
    
    total_time = df['time'].max()
    sums = df.drop('time', axis=1).sum().to_frame('counts')

    sums_list = sums
    sums_list['channel'] = sums_list.index

    sums_list = sums_list[['channel', 'counts']].apply(tuple, axis=1).tolist()
    

    return JsonResponse({'spectrum_values': sums_list, 'total_time': total_time})



def GetEvolution(request, pk):

    minTime = request.GET.get('minTime', 'nan') # nan string je tu z duvodu, ze to je vychozi hodnota v js
    maxTime = request.GET.get('maxTime', 'nan')

    record = Record.objects.filter(pk=pk)
    df = pd.read_pickle(record[0].data_file.path)

    df['time'] = df['time'].astype(float)

    start_time = record[0].time_start.timestamp()*1000
    print(start_time)

    if not (minTime != 'nan' and maxTime != 'nan'):
        minTime = (float(minTime)-start_time)*1000
        maxTime = (float(maxTime)-start_time)*1000
        df = df[(df['time'] >= minTime) & (df['time'] <= maxTime)]

    time = df['time'].astype(float).add(start_time)*1000
    sums = df.drop('time', axis=1).sum(axis=1)

    data = pd.DataFrame({'time': time, 'value': sums})
    data_list = data[['time', 'value']].apply(tuple, axis=1).tolist()


    return JsonResponse({'evolution_values': data_list})

def GetHistogram(request, pk):

    record = Record.objects.filter(pk=pk)
    df = pd.read_pickle(record[0].data_file.path).drop('time', axis=1)

    #print(df)

    data_list = []
    for row in df.iterrows():
        for column in df.columns:
            data_list.append([column, row[0], row[1][column]])

    return JsonResponse({'histogram_values': data_list[1:]})