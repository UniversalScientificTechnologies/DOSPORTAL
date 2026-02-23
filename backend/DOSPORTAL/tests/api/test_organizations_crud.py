import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from DOSPORTAL.models import Organization, OrganizationUser


@pytest.mark.django_db
def test_create_organization_success():
    """POST /organizations/ - create organization"""
    user = User.objects.create_user(username="owner", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        "/api/organizations/",
        {
            "name": "TestOrg",
            "data_policy": "PU",
            "website": "https://example.com",
            "contact_email": "test@example.com",
            "description": "Test org",
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["name"] == "TestOrg"
    assert Organization.objects.filter(name="TestOrg").exists()


@pytest.mark.django_db
def test_get_organization_detail_success():
    """GET /organizations/{org_id}/ - get organization detail"""
    user = User.objects.create_user(username="user1", password="pass123")
    org = Organization.objects.create(name="TestOrg")

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get(f"/api/organizations/{org.id}/")

    assert response.status_code == 200
    assert response.data["name"] == "TestOrg"


@pytest.mark.django_db
def test_update_organization_success_as_owner():
    """PUT /organizations/{org_id}/ - update organization as owner"""
    owner = User.objects.create_user(username="owner", password="pass123")
    org = Organization.objects.create(name="TestOrg")
    OrganizationUser.objects.create(user=owner, organization=org, user_type="OW")

    client = APIClient()
    client.force_authenticate(user=owner)
    response = client.put(
        f"/api/organizations/{org.id}/",
        {"name": "UpdatedOrg", "description": "Updated"},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["name"] == "UpdatedOrg"


@pytest.mark.django_db
def test_update_organization_success_as_admin():
    """PUT /organizations/{org_id}/ - update organization as admin"""
    owner = User.objects.create_user(username="owner", password="pass123")
    admin = User.objects.create_user(username="admin", password="pass123")
    org = Organization.objects.create(name="TestOrg")
    OrganizationUser.objects.create(user=owner, organization=org, user_type="OW")
    OrganizationUser.objects.create(user=admin, organization=org, user_type="AD")

    client = APIClient()
    client.force_authenticate(user=admin)
    response = client.put(
        f"/api/organizations/{org.id}/",
        {"name": "UpdatedByAdmin"},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["name"] == "UpdatedByAdmin"


@pytest.mark.django_db
def test_update_organization_forbidden_for_non_admin():
    """PUT /organizations/{org_id}/ - forbidden for non-admin user"""
    owner = User.objects.create_user(username="owner", password="pass123")
    other = User.objects.create_user(username="other", password="pass123")
    org = Organization.objects.create(name="TestOrg")
    OrganizationUser.objects.create(user=owner, organization=org, user_type="OW")

    client = APIClient()
    client.force_authenticate(user=other)
    response = client.put(
        f"/api/organizations/{org.id}/",
        {"name": "UpdatedOrg"},
        format="json",
    )

    assert response.status_code == 403
