from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import TemplateView
import uuid

from . import views_organizations

urlpatterns = [


    path(r'<uuid:pk>', views_organizations.organization_profile, name='organization-detail'),
    path(r'<slug:slug>', views_organizations.organization_profile, name='organization-detail'),
    path(r'', views_organizations.organization_profile, name='organization'),

]