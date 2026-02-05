from .models import (Flight)

from django.shortcuts import render




FIRST_CHANNEL = 10


def FlightView(request, pk):
    flight = Flight.objects.get(pk=pk)
    #return HttpResponse(a)
    return render(request, 'flights/flight_detail.html', context={'flight': flight })

