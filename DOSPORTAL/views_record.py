from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
from .models import (DetectorManufacturer, measurement, 
                     record, Detector, DetectorType, DetectorLogbook)
from .forms import DetectorLogblogForm

from django.shortcuts import get_object_or_404, redirect, render

from DOSPORTAL import models

from django.views import generic
from django.views.generic import ListView


FIRST_CHANNEL = 10


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