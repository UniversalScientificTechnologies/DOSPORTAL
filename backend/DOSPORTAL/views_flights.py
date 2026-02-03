from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
from .models import (Flight)

from django.shortcuts import get_object_or_404, redirect, render

from DOSPORTAL import models



FIRST_CHANNEL = 10


def FlightView(request, pk):
    flight = Flight.objects.get(pk=pk)
    #return HttpResponse(a)
    return render(request, 'flights/flight_detail.html', context={'flight': flight })

