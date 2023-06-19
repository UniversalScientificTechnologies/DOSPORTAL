from django import forms
from django.http import HttpResponse
from django.views import generic
from .models import (DetectorManufacturer, measurement, 
                     record, Detector, DetectorType)

from django.shortcuts import get_object_or_404, redirect, render

from DOSPORTAL import models


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
        exclude = ("time_end", "measurement", "detector", "log_filename")



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



