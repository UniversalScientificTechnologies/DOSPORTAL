from django.urls import path
from . import views 

urlpatterns = [
    path('measurement/', views.MeasurementsGet),
    path('measurement/add/', views.MeasurementsPost),
    path('record/', views.RecordGet),
]