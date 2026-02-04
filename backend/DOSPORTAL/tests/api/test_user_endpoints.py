import pytest
from rest_framework.test import APIClient
from DOSPORTAL.models import Organization, OrganizationUser, User


@pytest.mark.django_db
def test_get_user_profile():
    """GET /user/profile/ - get profile"""
    user = User.objects.create_user(
        username="user1",
        password="pass123",
        email="user1@example.com",
        first_name="User",
        last_name="One",
    )

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/user/profile/")

    assert response.status_code == 200
    assert response.data["username"] == "user1"
    assert response.data["email"] == "user1@example.com"


@pytest.mark.django_db
def test_update_user_profile():
    """PUT /user/profile/ - update profile"""
    user = User.objects.create_user(username="user1", password="pass123")

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.put(
        "/api/user/profile/",
        {"email": "new@example.com", "first_name": "New", "last_name": "Name"},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["email"] == "new@example.com"
    assert response.data["first_name"] == "New"
    assert response.data["last_name"] == "Name"


@pytest.mark.django_db
def test_get_user_organizations():
    """GET /user/organizations/ - list memberships"""
    user = User.objects.create_user(username="user1", password="pass123")
    org1 = Organization.objects.create(name="Org1")
    org2 = Organization.objects.create(name="Org2")
    OrganizationUser.objects.create(user=user, organization=org1, user_type="ME")
    OrganizationUser.objects.create(user=user, organization=org2, user_type="AD")

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/user/organizations/")

    assert response.status_code == 200
    assert len(response.data) == 2
    names = {item["name"] for item in response.data}
    assert names == {"Org1", "Org2"}
