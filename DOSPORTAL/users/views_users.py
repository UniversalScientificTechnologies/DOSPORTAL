import django
from django.shortcuts import render, redirect
from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
from ..models import (DetectorManufacturer, measurement, 
                     record, Detector, DetectorType)

from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User


@login_required
def user_profile(request, username = None):
    if username is None:
        return redirect('user_profile', username=request.user.username)

    user = get_object_or_404(User, username = username)
    #user = request.user
    context = {
        'user': user
    }

    return render(request, 'user/user_profile.html', context)