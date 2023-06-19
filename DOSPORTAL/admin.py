from django.contrib import admin
from .models import *


admin.site.register(DetectorManufacturer)
admin.site.register(measurement)
admin.site.register(record)
admin.site.register(Detector)
admin.site.register(DetectorType)
admin.site.register(Airports)
admin.site.register(Flight)
admin.site.register(MeasurementDataFlight)