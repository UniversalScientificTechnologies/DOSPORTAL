from django.urls import path
from . import views
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("version/", views.Version),
    path("login/", views.Login),
    path("signup/", views.Signup),
    path("logout/", views.Logout),
    path("measurement/", views.MeasurementsGet),
    path("measurement/add/", views.MeasurementsPost),
    path("record/", views.RecordGet),
    path("detector/", views.DetectorGet),
    path("detector/<uuid:detector_id>/qr/", views.DetectorQRCode),
    path("detector-manufacturer/", views.DetectorManufacturer),
    path("detector-manufacturer/<uuid:manufacturer_id>/", views.DetectorManufacturerDetail),
    path("logbook/", views.DetectorLogbookGet),
    path("logbook/add/", views.DetectorLogbookPost),
    path("logbook/<uuid:entry_id>/", views.DetectorLogbookPut),
    path("user/profile/", views.UserProfile),
    path("user/organizations/", views.UserOrganizations),
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
