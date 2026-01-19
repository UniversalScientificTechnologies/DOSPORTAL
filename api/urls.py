from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.Login),
    path("logout/", views.Logout),
    path("measurement/", views.MeasurementsGet),
    path("measurement/add/", views.MeasurementsPost),
    path("record/", views.RecordGet),
    path("detector/", views.DetectorGet),
    path("detector/<uuid:detector_id>/qr/", views.DetectorQRCode),
    path("logbook/", views.DetectorLogbookGet),
    path("logbook/add/", views.DetectorLogbookPost),
    path("logbook/<uuid:entry_id>/", views.DetectorLogbookPut),
    path("user/profile/", views.UserProfile),
    path("user/organizations/", views.UserOrganizations),
]
