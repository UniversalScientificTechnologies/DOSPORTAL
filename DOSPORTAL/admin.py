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


class OrganizationUserInline(admin.TabularInline):
    model = OrganizationUser

class OrganizationAdmin(admin.ModelAdmin):
   list_display = ('name', 'slug', 'data_policy', 'can_users_change_policy', 'created_at', 'updated_at', 'website', 'contact_email', 'user_count')
   search_fields = ('name', 'slug', 'data_policy', 'website', 'contact_email', 'users')
   list_filter = ('data_policy', 'can_users_change_policy')
   inlines = [OrganizationUserInline]

   def user_count(self, obj):
       return obj.users.count()
   user_count.short_description = 'User Count'

   # def admin_count(self, obj):
   #     return obj.users.filter(role='admin').count()
   # admin_count.short_description = 'Admin Count'

   # def owner_count(self, obj):
   #     return obj.users.filter(role='owner').count()
   # owner_count.short_description = 'Owner Count'



admin.site.register(Profile)
admin.site.register(DetectorManufacturer)
admin.site.register(measurement)
admin.site.register(Organization, OrganizationAdmin)
#admin.site.register(OrganizationUser)
admin.site.register(Record)
admin.site.register(Detector)
admin.site.register(DetectorLogbook)
admin.site.register(DetectorType)
admin.site.register(DetectorCalib)
admin.site.register(Airports, AirportsAdmin)
admin.site.register(Flight)
admin.site.register(MeasurementDataFlight)
admin.site.register(measurement_campaign)


admin.site.register(Trajectory)
admin.site.register(TrajectoryPoint)

admin.site.register(SpectrumData)

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
