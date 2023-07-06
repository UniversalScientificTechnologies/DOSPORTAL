from django.contrib import admin
from .models import *


from import_export import resources
from import_export.admin import ImportExportModelAdmin


class AirportsResource(resources.ModelResource):
   class Meta:
      model = Airports

class AirportsAdmin(ImportExportModelAdmin):
   resource_class = AirportsResource
   ordering = ['code_iata']


admin.site.register(DetectorManufacturer)
admin.site.register(measurement)
admin.site.register(record)
admin.site.register(Detector)
admin.site.register(DetectorLogbook)
admin.site.register(DetectorType)
admin.site.register(DetectorCalib)
admin.site.register(Airports, AirportsAdmin)
admin.site.register(Flight)
admin.site.register(MeasurementDataFlight)
admin.site.register(measurement_campaign)


from django_q import models as q_models
from django_q import admin as q_admin

admin.site.unregister([q_models.Failure])
@admin.register(q_models.Failure)
class ChildClassAdmin(q_admin.FailAdmin):
    list_display = (
        'name',
        'func',
        'result',
        'started',
        # add attempt_count to list_display
        'attempt_count'
    )
