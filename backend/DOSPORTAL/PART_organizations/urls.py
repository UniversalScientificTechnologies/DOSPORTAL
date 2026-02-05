from django.urls import path

from . import views_organizations

urlpatterns = [


    path(r'<uuid:pk>', views_organizations.organization_profile, name='organization-detail'),
    path(r'<slug:slug>', views_organizations.organization_profile, name='organization-detail'),
    path(r'', views_organizations.organization_profile, name='organization'),

]