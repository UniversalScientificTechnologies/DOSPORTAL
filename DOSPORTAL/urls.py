"""
URL configuration for DOSPORTAL project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from . import views
from django.views.generic.base import TemplateView
import uuid

from .views import MeasurementsListView, MeasurementDetailView, MeasurementNewView, RecordNewView, MeasurementDataView, measuredDataGet, measuredSpectraGet
from .views_detectors import DetectorView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("accounts/", include("django.contrib.auth.urls")),

    path("measurements/", MeasurementsListView.as_view(), name="measurements"),
    path("measurement/new/", MeasurementNewView, name='measurement-new'),
    path('measurement/<uuid:pk>/record/new/', RecordNewView, name="record-upload"),
    path('measurement/<uuid:pk>/visualizate/', MeasurementDataView, name="measurement-data-view"),
    # path('measurement/<uuid:pk>/metadata/', MeasurementDataView, name="measurement-data-view"),
    path('measurement/<uuid:pk>/measured_data/', measuredDataGet, name="measurement-data-get"),
    path('measurement/<uuid:pk>/measured_spectra/', measuredSpectraGet, name="measurement-spectra-get"),
    path('measurement/<uuid:pk>/', MeasurementDetailView, name='measurement-detail'),


    path('detector/<uuid:pk>/', DetectorView, name="detector-view"),
    
    path("select2/", include("django_select2.urls")),
    path('martor/', include('martor.urls')),

    path('analysis/', TemplateView.as_view(template_name='home.html'), name='analysis'),

    #path("record/"),

    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/', include('api.urls')),
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
]
