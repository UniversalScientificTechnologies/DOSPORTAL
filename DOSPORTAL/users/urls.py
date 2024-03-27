from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import TemplateView
import uuid

from . import views_users

urlpatterns = [


    path(r'<str:username>', views_users.user_profile, name='user_profile'),
    path(r'', views_users.user_profile, name='profile'),

]