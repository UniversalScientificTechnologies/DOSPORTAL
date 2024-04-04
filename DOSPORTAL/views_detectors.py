from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
from .models import (DetectorManufacturer, measurement, 
                     Record, Detector, DetectorType, DetectorLogbook)
from .forms import DetectorLogblogForm, DetectorEditForm

from django.shortcuts import get_object_or_404, redirect, render

from DOSPORTAL import models

from django.views import generic
from django.views.generic import ListView


FIRST_CHANNEL = 10


def DetectorView(request, pk):
    detector = Detector.objects.get(pk=pk)
    #return HttpResponse(a)
    return render(request, 'detectors/detectors_detail.html', context={'detector': detector, 'DetectorLogblogForm': DetectorLogblogForm})


def DetectorEditView(request, pk=None):
    detectorEditForm = DetectorEditForm( instance=Detector.objects.get(pk=pk) if pk else None)

    if request.method == 'POST':
        detectorEditForm = DetectorEditForm(request.POST)
        if detectorEditForm.is_valid():
            detectorEditForm.save()
            return redirect('detector-view', pk=detectorEditForm.instance.pk)

    return render(request, 'detectors/detector_edit.html', context={'detectorEditForm': detectorEditForm})


class  DetectorOverview(generic.ListView):
    #detectors = DetectorsTable()
    model = Detector
    context_object_name = "detector_list"
    sequence = ("id", "sn", "name", )
    queryset = Detector.objects.all()
    template_name = 'detectors/detectors_overview.html'

    # def get_context_data(self, **kwargs):
    #     context = super(DetectorOverview, self).get_context_data(**kwargs)
    #     context['some_data'] = 'This is just some data'
    #     return context


    def POST(self, request, *args, **kwargs):
        # Tato část se zavolá při POST požadavku
        print("POST")
        print(request)
        form = DetectorLogblogForm(request.POST)  # Nahraďte 'YourForm' za skutečný název vašeho formuláře
        if form.is_valid():

            text = form.cleaned_data['text']
            DetectorLogbook.objects.create(detector=detector, author=request.user, text=text)

            return redirect('detector-view')


        return render(request, self.template_name, {'form': form, 'detector_list': self.get_queryset()})

def DetectorNewLogbookRecord(request, pk):
    detector = Detector.objects.get(pk=pk)

    form = DetectorLogblogForm(request.POST)  # Nahraďte 'YourForm' za skutečný název vašeho formuláře
    if form.is_valid():

        text = form.cleaned_data['text']
        DetectorLogbook.objects.create(detector=detector, author=request.user, text=text)

        return redirect('detector-view', pk=pk)
    #return HttpResponse(a)



def DetectorTypeView(request, pk):
    detectorType = DetectorType.objects.get(pk=pk)
    return render(request, 'detectors/detector_type_detail.html', context={'detector': detectorType})