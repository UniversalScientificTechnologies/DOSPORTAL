import django
from django.shortcuts import render, redirect
from django import forms
from django.http import HttpResponse, JsonResponse
from django.views import generic
from ..models import (Organization, OrganizationUser)

from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User


@login_required
def organization_profile(request, pk = None, slug = None):
    if pk:
        organization = Organization.objects.get(pk=pk)
    elif slug:
        organization = Organization.objects.get(slug=slug)

    return render(request, 'organizations/organization_profile.html', {'organization':organization})