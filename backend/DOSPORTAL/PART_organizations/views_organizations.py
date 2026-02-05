from django.shortcuts import render
from ..models import (Organization)

from django.contrib.auth.decorators import login_required


@login_required
def organization_profile(request, pk = None, slug = None):
    if pk:
        organization = Organization.objects.get(pk=pk)
    elif slug:
        organization = Organization.objects.get(slug=slug)

    return render(request, 'organizations/organization_profile.html', {'organization':organization})