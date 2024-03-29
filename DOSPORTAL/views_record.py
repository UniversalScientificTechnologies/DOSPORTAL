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

from .forms import RecordForm


FIRST_CHANNEL = 10

class RecordsListView(generic.ListView):
    model = Record
    context_object_name = 'records_list' 
    queryset = Record.objects.all()
    template_name = 'records/records_list.html' 

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


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

            print(data)
            data.save()

            return redirect("record-view", pk=pk)    
            
        else:
            print("Form není validni")
            print(form.errors)
            return render(request, 'records/record_new.html', {'form': form})
    
    else:
        form = RecordForm()
        return render(request, 'records/record_new.html', {'form': form})

def RecordView(request, pk):
    rec = Record.objects.get(pk=pk)
    return render(request, 'records/record_detail.html', context={'record': rec})


def GetSpectrum(request, pk):

    record_o = Record.objects.filter(pk=pk)
    print(record_o)
    pass



def GetEvolution(request, pk):

    record_o = Record.objects.filter(pk=pk)
    print(record_o)
    pass