from django.urls import path
from . import views
from .views import spectrals
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("version/", views.Version),
    # auth
    path("login/", views.Login),
    path("signup/", views.Signup),
    path("logout/", views.Logout),
    # measurements
    path("measurement/", views.MeasurementsGet),
    path("measurement/add/", views.MeasurementsPost),
    path("measurement/<uuid:measurement_id>/", views.MeasurementDetail),
    # File endpoints
    path("file/", views.FileList),
    path("file/<uuid:file_id>/", views.FileDetail),
    path("file/upload/", views.FileUpload),
    # Spectral Record endpoints
    path("spectral-record/", spectrals.SpectralRecordList),
    path("spectral-record/create/", spectrals.SpectralRecordCreate),
    path("spectral-record/<uuid:record_id>/", spectrals.SpectralRecordDetail),
    path("spectral-record/<uuid:record_id>/histogram/", spectrals.SpectralRecordHistogram),
    path("spectral-record/<uuid:record_id>/histogram/simple/", spectrals.SpectralRecordHistogramSimple),
    path("spectral-record-artifact/", spectrals.SpectralRecordArtifactList),
    # Detectors
    path("detector/", views.DetectorGet),
    path("detector/<uuid:detector_id>/qr/", views.DetectorQRCode),
    path("detector-manufacturer/", views.detector_manufacturer_list),
    path(
        "detector-manufacturer/<uuid:manufacturer_id>/",
        views.detector_manufacturer_detail,
    ),
    path("detector-type/", views.DetectorTypeList),
    path("detector-type/<uuid:type_id>/", views.DetectorTypeDetail),
    # Detector logbooks
    path("logbook/", views.DetectorLogbookGet),
    path("logbook/add/", views.DetectorLogbookPost),
    path("logbook/<uuid:entry_id>/", views.DetectorLogbookPut),
    # organizations / users
    path("user/profile/", views.UserProfile),
    path("user/<int:user_id>/", views.UserDetail),
    path("user/organizations/", views.UserOrganizations),
    path("user/organizations/owned/", views.UserOrganizationsOwned),
    path("organizations/", views.Organizations),
    path("organizations/<uuid:org_id>/", views.OrganizationDetail),
    path("organizations/<uuid:org_id>/member/", views.OrganizationMember),
    path("organizations/<uuid:org_id>/invites/", views.CreateOrganizationInvite),
    path("invites/<str:token>/accept/", views.AcceptOrganizationInvite),
    path("invites/<str:token>/", views.GetOrganizationInviteDetails),
    # API documentation
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
