from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views
from .views import spectrals
from .viewsets import (
    OrganizationViewSet,
    InviteViewSet,
    DetectorManufacturerViewSet,
    DetectorTypeViewSet,
    DetectorViewSet,
    DetectorLogbookViewSet,
    MeasurementViewSet,
    MeasurementSegmentViewSet,
    FileViewSet,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

router = SimpleRouter()
router.register(r"organizations", OrganizationViewSet, basename="organization")
router.register(r"invites", InviteViewSet, basename="invite")
router.register(r"detector-manufacturers", DetectorManufacturerViewSet, basename="detector-manufacturer")
router.register(r"detector-types", DetectorTypeViewSet, basename="detector-type")
router.register(r"detectors", DetectorViewSet, basename="detector")
router.register(r"logbook", DetectorLogbookViewSet, basename="logbook")
router.register(r"measurements", MeasurementViewSet, basename="measurement")
router.register(r"measurement-segments", MeasurementSegmentViewSet, basename="measurement-segment")
router.register(r"files", FileViewSet, basename="file")

urlpatterns = [
    # ViewSet routes (Organization, Detector*, LogBook)
    path("", include(router.urls)),

    path("version/", views.Version),
    # auth
    path("login/", views.Login),
    path("signup/", views.Signup),
    path("logout/", views.Logout),
    # measurements
    # File endpoints
    # Spectral Record endpoints
    path("spectral-record/", spectrals.SpectralRecordList),
    path("spectral-record/<uuid:record_id>/", spectrals.SpectralRecordDetail),
    path("spectral-record/<uuid:record_id>/evolution/", spectrals.SpectralRecordEvolution),
    path("spectral-record/<uuid:record_id>/spectrum/", spectrals.SpectralRecordSpectrum),
    path("spectral-record-artifact/", spectrals.SpectralRecordArtifactList),
    # Detector QR code (custom, stays as FBV)
    path("detectors/<uuid:detector_id>/qr/", views.DetectorQRCode),
    # organizations / users
    path("user/profile/", views.UserProfile),
    path("user/<int:user_id>/", views.UserDetail),
    path("user/organizations/", views.UserOrganizations),
    path("user/organizations/owned/", views.UserOrganizationsOwned),
    # Org-scoped create endpoints (require org_id in URL)
    path("organizations/<uuid:org_id>/spectral-records/", spectrals.SpectralRecordCreate),
    # API documentation
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
