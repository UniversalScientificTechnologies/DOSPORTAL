from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views
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
    SpectralRecordViewSet,
    SpectralRecordArtifactViewSet,
    FlightViewSet,
    AirportsViewSet,
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
router.register(r"logbooks", DetectorLogbookViewSet, basename="logbook")
router.register(r"measurements", MeasurementViewSet, basename="measurement")
router.register(r"measurement-segments", MeasurementSegmentViewSet, basename="measurement-segment")
router.register(r"files", FileViewSet, basename="file")
router.register(r"spectral-records", SpectralRecordViewSet, basename="spectral-record")
router.register(r"spectral-record-artifacts", SpectralRecordArtifactViewSet, basename="spectral-record-artifact")
router.register(r"flights", FlightViewSet, basename="flight")
router.register(r"airports", AirportsViewSet, basename="airport")

urlpatterns = [
    path("", include(router.urls)),

    path("version/", views.Version),
    # auth
    path("login/", views.Login),
    path("signup/", views.Signup),
    path("logout/", views.Logout),
    # Detector QR code (custom, stays as FBV)
    path("detectors/<uuid:detector_id>/qr/", views.DetectorQRCode),
    # organizations / users
    path("user/profile/", views.UserProfile),
    path("user/<int:user_id>/", views.UserDetail),
    path("user/organizations/", views.UserOrganizations),
    path("user/organizations/owned/", views.UserOrganizationsOwned),
    # API documentation
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
