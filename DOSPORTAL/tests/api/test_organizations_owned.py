import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from DOSPORTAL.models import Organization, OrganizationUser

@pytest.mark.django_db
def test_owned_endpoint_owner_and_admin():
    user = User.objects.create_user(username="testuser", password="testpass")
    org1 = Organization.objects.create(name="Org1")
    org2 = Organization.objects.create(name="Org2")
    org3 = Organization.objects.create(name="Org3")
    
    OrganizationUser.objects.create(user=user, organization=org1, user_type="OW")
    OrganizationUser.objects.create(user=user, organization=org2, user_type="AD")
    OrganizationUser.objects.create(user=user, organization=org3, user_type="ME")

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/user/organizations/owned/")
    assert response.status_code == 200
    data = response.json()
    ids = {o['id'] for o in data}
    assert str(org1.id) in ids
    assert str(org2.id) in ids
    assert str(org3.id) not in ids

@pytest.mark.django_db
def test_owned_endpoint_no_orgs():
    user = User.objects.create_user(username="testuser2", password="testpass")
    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/user/organizations/owned/")
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.django_db
def test_owned_endpoint_unauthenticated():
    client = APIClient()
    response = client.get("/api/user/organizations/owned/")
    assert response.status_code == 401
