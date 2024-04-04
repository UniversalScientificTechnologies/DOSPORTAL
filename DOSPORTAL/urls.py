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
from django.conf.urls.static import static
from django.conf import settings
from . import views
from django.views.generic.base import TemplateView

import uuid

from .users.views_users import user_profile, login_view
from .users import urls as user_urls
from .views import MeasurementsListView, MeasurementDetailView, MeasurementNewView, MeasurementNewView, MeasurementDataView, measuredDataGet, measuredSpectraGet, MeasurementRecordNewView
from .views_detectors import DetectorView, DetectorEditView,DetectorOverview, DetectorNewLogbookRecord
from .views_flights import FlightView
from .views_record import RecordsListView, RecordView, RecordNewView, GetSpectrum, GetEvolution, GetHistogram

#from organizations.backends import invitation_backend


urlpatterns = [
    path('admin/', admin.site.urls),
    path("accounts/", include("django.contrib.auth.urls")),

    path('login/', login_view, name='login'),

    #path(r'accounts/', include('organizations.urls')),
    #path(r'invitations/', include(invitation_backend().get_urls())),

    #path('user/', user_profile, name='profile'),
    #path('user/<str:username>', user_profile, name='user_profile'),

    path('user/', include('DOSPORTAL.users.urls')),
    path('organization/', include('DOSPORTAL.PART_organizations.urls')),
    #path('account/', include('DOSPORTAL.users.urls')),

    path("measurements/", MeasurementsListView.as_view(), name="measurements"),
    path("measurement/new/", MeasurementNewView, name='measurement-new'),
    path('measurement/<uuid:pk>/new/', MeasurementRecordNewView, name="record-upload"),
    path('measurement/<uuid:pk>/visualizate/', MeasurementDataView, name="measurement-data-view"),
    # path('measurement/<uuid:pk>/metadata/', MeasurementDataView, name="measurement-data-view"),
    path('measurement/<uuid:pk>/measured_data/', measuredDataGet, name="measurement-data-get"),
    path('measurement/<uuid:pk>/measured_evolution/', measuredDataGet, name="measurement-evolution-get"),
    path('measurement/<uuid:pk>/measured_spectra/', measuredSpectraGet, name="measurement-spectra-get"),
    path('measurement/<uuid:pk>/', MeasurementDetailView, name='measurement-detail'),


    path('records/', RecordsListView, name='records'),

    path('record/new/', RecordNewView, name='record-new'),
    path('record/<uuid:pk>/', RecordView, name='record-view'),
    path('record/<uuid:pk>/get_spectrum/', GetSpectrum, name='record-GetSpectrum'),
    path('record/<uuid:pk>/get_evolution/', GetEvolution, name='record-GetEvolution'),
    path('record/<uuid:pk>/get_histogram/', GetHistogram, name='record-GetHistogram'),


    path('flight/<uuid:pk>/', FlightView, name='flight-detail'),

    path('detector/<uuid:pk>/new_logbook_record', DetectorNewLogbookRecord),
    path('detector/new/', DetectorEditView, name="detector-new"),
    path('detectors/', DetectorOverview.as_view(), name="detector-overview"),
    path('detector/<uuid:pk>/edit/', DetectorEditView, name="detector-edit"),
    path('detector/<uuid:pk>/', DetectorView, name="detector-view"),
    
    path("select2/", include("django_select2.urls")),
    path('martor/', include('martor.urls')),

    path('analysis/', TemplateView.as_view(template_name='home.html'), name='analysis'),

    #path("record/"),

    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/', include('api.urls')),
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)