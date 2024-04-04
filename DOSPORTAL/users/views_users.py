import django
from django.shortcuts import render, redirect
from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
from ..models import (DetectorManufacturer, measurement, 
                     Record, Detector, DetectorType)

from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

from django.contrib.auth import authenticate, login

from ..forms import LoginForm

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




def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            user = authenticate(request, username=form.cleaned_data['username'], password=form.cleaned_data['password'])
            if user is not None:
                login(request, user)
                return redirect('home')
            else:
                return render(request, 'login.html', {'form': form, 'error': 'Invalid username or password'})
    else:
        form = LoginForm()
    return render(request, 'user/login.html', {'form': form})