import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from DOSPORTAL.models import Organization, OrganizationUser


def _create_invite(client, org_id):
    response = client.post(
        f"/api/organizations/{org_id}/invites/",
        {"user_type": "ME", "expires_hours": 24},
        format="json",
    )
    return response


def _extract_token(invite_url: str) -> str:
    # invite_url format: /invite/<token>/
    return invite_url.strip("/").split("/")[-1]


@pytest.mark.django_db
def test_create_invite_success():
    """POST /organizations/{org_id}/invites/ - create invite"""
    owner = User.objects.create_user(username="owner", password="pass123")
    org = Organization.objects.create(name="TestOrg")
    OrganizationUser.objects.create(user=owner, organization=org, user_type="OW")

    client = APIClient()
    client.force_authenticate(user=owner)
    response = _create_invite(client, org.id)

    assert response.status_code == 201
    assert "invite_url" in response.data
    assert response.data["user_type"] == "ME"


@pytest.mark.django_db
def test_get_invite_details_success():
    """GET /invites/{token}/ - get invite details"""
    owner = User.objects.create_user(username="owner", password="pass123")
    org = Organization.objects.create(name="TestOrg")
    OrganizationUser.objects.create(user=owner, organization=org, user_type="OW")

    client = APIClient()
    client.force_authenticate(user=owner)
    invite_response = _create_invite(client, org.id)
    token = _extract_token(invite_response.data["invite_url"])

    anon_client = APIClient()
    response = anon_client.get(f"/api/invites/{token}/")

    assert response.status_code == 200
    assert response.data["organization"]["name"] == "TestOrg"
    assert response.data["user_type"] == "ME"
    assert response.data["is_active"] is True


@pytest.mark.django_db
def test_accept_invite_success():
    """POST /invites/{token}/accept/ - accept invite"""
    owner = User.objects.create_user(username="owner", password="pass123")
    new_user = User.objects.create_user(username="newuser", password="pass123")
    org = Organization.objects.create(name="TestOrg")
    OrganizationUser.objects.create(user=owner, organization=org, user_type="OW")

    owner_client = APIClient()
    owner_client.force_authenticate(user=owner)
    invite_response = _create_invite(owner_client, org.id)
    token = _extract_token(invite_response.data["invite_url"])

    client = APIClient()
    client.force_authenticate(user=new_user)
    response = client.post(f"/api/invites/{token}/accept/")

    assert response.status_code == 200
    assert response.data["detail"] == "Joined."
    assert response.data["user_type"] == "ME"
