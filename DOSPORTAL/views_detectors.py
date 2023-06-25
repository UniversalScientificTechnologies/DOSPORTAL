from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
from .models import (DetectorManufacturer, measurement, 
                     record, Detector, DetectorType)

from django.shortcuts import get_object_or_404, redirect, render

from DOSPORTAL import models



FIRST_CHANNEL = 10


def DetectorView(request, pk):
    detector = Detector.objects.get(pk=pk)
    #return HttpResponse(a)
    return render(request, 'detectors/detectors_detail.html', context={'detector': detector })

