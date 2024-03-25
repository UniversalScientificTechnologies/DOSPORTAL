from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
from .models import (DetectorManufacturer, measurement, record, 
                     record, Detector, DetectorType, DetectorLogbook)
from .forms import DetectorLogblogForm

from django.shortcuts import get_object_or_404, redirect, render

from DOSPORTAL import models

from django.views import generic
from django.views.generic import ListView

from .forms import RecordForm


FIRST_CHANNEL = 10

class RecordsListView(generic.ListView):
    model = record
    context_object_name = 'records_list' 
    queryset = record.objects.filter()
    template_name = 'records/records_list.html' 


    def get_context_data(self, **kwargs):
        context = super(RecordsListView, self).get_context_data(**kwargs)
        return context


def RecordNewView(request):
    if request.method == "POST":
        print("POST... s formulářem :) ")
        form = RecordForm(request.POST, request.FILES)
        #print(form)

        if form.is_valid():
            data = form.save(commit=False)
            data.author = request.user
            data.log_file = request.FILES['log_file']
            
            #data.log_filename = request.FILES['log_file'].name.split("/")[-1]
            handle_uploaded_file(request.FILES['log_file'], data.log_file.name)
            metadata = obtain_parameters_from_log(data.log_file.path)
            print("Medatada z logu")
            print(metadata)
            if metadata:
                detector_pk = Detector.objects.get(sn=metadata['detector']['detector_sn'])
                if detector_pk:
                    data.detector = detector_pk
                data.metadata = metadata
                data.record_duration = timedelta(seconds = metadata['record']['duration'])
            #data.measurement = measurement.objects.get(pk=pk)
            pk = data.pk

            print(data)
            data.save()
            
        else:
            print("Form není validni")
            print(form.errors)
        
        return redirect("record-detail", pk=pk)
    
    else:
        form = RecordForm()
        return render(request, 'records/record_new.html', {'form': form})

def RecordView(request, pk):
    rec = record.objects.get(pk=pk)
    return render(request, 'records/record_detail.html', context={'record': rec})


def GetSpectrum(request, pk):

    record_o = record.objects.filter(pk=pk)
    print(record_o)
    pass



def GetEvolution(request, pk):

    record_o = record.objects.filter(pk=pk)
    print(record_o)
    pass