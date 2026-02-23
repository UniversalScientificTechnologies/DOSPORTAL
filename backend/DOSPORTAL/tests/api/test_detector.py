import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from DOSPORTAL.models import (
    Organization,
    OrganizationUser,
    Detector,
    DetectorType,
    DetectorManufacturer,
)


@pytest.mark.django_db
def test_create_detector_success():
    # Setup user, org, manufacturer, type
    user = User.objects.create_user(username="admin", password="pass12345")
    org = Organization.objects.create(name="Test Org")
    OrganizationUser.objects.create(user=user, organization=org, user_type="OW")
    manufacturer = DetectorManufacturer.objects.create(
        name="Manufa", url="http://manuf.com"
    )
    dtype = DetectorType.objects.create(name="TypeX", manufacturer=manufacturer)
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        "sn": "SN001",
        "name": "Detector1",
        "type_id": str(dtype.id),
        "owner": str(org.id),
    }
    response = client.post("/api/detector/", data, format="json")
    assert response.status_code == 201
    assert response.data["name"] == "Detector1"
    assert response.data["owner"] == str(org.id)


@pytest.mark.django_db
def test_create_detector_no_permission():
    user = User.objects.create_user(username="user", password="pass12345")
    org = Organization.objects.create(name="Test Org")
    manufacturer = DetectorManufacturer.objects.create(
        name="Manuf", url="http://manuf.com"
    )
    dtype = DetectorType.objects.create(name="Type1", manufacturer=manufacturer)
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        "sn": "SN002",
        "name": "Detector2",
        "type_id": str(dtype.id),
        "owner": str(org.id),
    }
    response = client.post("/api/detector/", data, format="json")
    assert response.status_code == 403
    assert "permission" in response.data["detail"]


@pytest.mark.django_db
def test_create_detector_invalid_org():
    user = User.objects.create_user(username="admin2", password="pass12345")
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        "sn": "SN003",
        "name": "Detector3",
        "type_id": None,
        "owner": "00000000-0000-0000-0000-000000000000",
    }
    response = client.post("/api/detector/", data, format="json")
    assert response.status_code == 404
    assert "Organization not found" in response.data["detail"]


@pytest.mark.django_db
def test_create_detector_missing_owner():
    user = User.objects.create_user(username="admin3", password="pass12345")
    client = APIClient()
    client.force_authenticate(user=user)
    data = {"sn": "SN004", "name": "Detector4", "type_id": None}
    response = client.post("/api/detector/", data, format="json")
    assert response.status_code == 400
    assert "Owner organization is required" in response.data["detail"]


@pytest.mark.django_db
def test_create_detector_owner_in_other_org():
    user = User.objects.create_user(username="owner_other", password="pass12345")
    org1 = Organization.objects.create(name="Org1")
    org2 = Organization.objects.create(name="Org2")
    OrganizationUser.objects.create(user=user, organization=org1, user_type="OW")
    manufacturer = DetectorManufacturer.objects.create(
        name="Manuf", url="http://manuf.com"
    )
    dtype = DetectorType.objects.create(name="Type1", manufacturer=manufacturer)
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        "sn": "SN005",
        "name": "Detector5",
        "type_id": str(dtype.id),
        "owner": str(org2.id),
    }
    response = client.post("/api/detector/", data, format="json")
    assert response.status_code == 403
    assert "permission" in response.data["detail"]


@pytest.mark.django_db
def test_create_detector_member_only():
    user = User.objects.create_user(username="member", password="pass12345")
    org = Organization.objects.create(name="Test Org")
    OrganizationUser.objects.create(user=user, organization=org, user_type="ME")
    manufacturer = DetectorManufacturer.objects.create(
        name="Manuf", url="http://manuf.com"
    )
    dtype = DetectorType.objects.create(name="Type1", manufacturer=manufacturer)
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        "sn": "SN006",
        "name": "Detector6",
        "type_id": str(dtype.id),
        "owner": str(org.id),
    }
    response = client.post("/api/detector/", data, format="json")
    assert response.status_code == 403
    assert "permission" in response.data["detail"]


@pytest.mark.django_db
def test_create_detector_invalid_data():
    user = User.objects.create_user(username="admin4", password="pass12345")
    org = Organization.objects.create(name="Test Org")
    OrganizationUser.objects.create(user=user, organization=org, user_type="OW")
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        "sn": "",  # Missing required fields
        "name": "",
        "type_id": "",
        "owner": str(org.id),
    }
    response = client.post("/api/detector/", data, format="json")
    assert response.status_code == 400
    assert "sn" in response.data or "name" in response.data or "type" in response.data


@pytest.mark.django_db
def test_get_detectors_empty():
    """GET /detector/ - empty list"""
    user = User.objects.create_user(username="user1", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/detector/")
    assert response.status_code == 200
    assert response.data == []


@pytest.mark.django_db
def test_get_detectors_with_data():
    """GET /detector/ - with existing detectors"""
    # Setup
    user = User.objects.create_user(username="user1", password="pass123")
    manuf = DetectorManufacturer.objects.create(name="Sony", url="http://sony.com")
    dtype = DetectorType.objects.create(name="Gamma", manufacturer=manuf)
    org = Organization.objects.create(name="TestOrg")

    Detector.objects.create(name="Detector 1", type=dtype, owner=org, sn="SN001")
    Detector.objects.create(name="Detector 2", type=dtype, owner=org, sn="SN002")

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/detector/")
    assert response.status_code == 200
    assert len(response.data) == 2
    assert response.data[0]["name"] in ["Detector 1", "Detector 2"]


@pytest.mark.django_db
def test_get_detector_detail_success():
    """GET /detector/<id>/ - returns single detector"""
    user = User.objects.create_user(username="detailuser", password="pass123")
    manuf = DetectorManufacturer.objects.create(name="Manuf", url="http://manuf.com")
    dtype = DetectorType.objects.create(name="TypeA", manufacturer=manuf)
    org = Organization.objects.create(name="OrgA")
    detector = Detector.objects.create(name="Det1", type=dtype, owner=org, sn="SN-DETAIL")

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get(f"/api/detector/{detector.id}/")
    assert response.status_code == 200
    assert response.data["id"] == str(detector.id)
    assert response.data["name"] == "Det1"
    assert response.data["sn"] == "SN-DETAIL"


@pytest.mark.django_db
def test_get_detector_detail_not_found():
    """GET /detector/<id>/ - non-existent detector returns 404"""
    user = User.objects.create_user(username="detailuser2", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/detector/00000000-0000-0000-0000-000000000000/")
    assert response.status_code == 404
    assert "not found" in response.data["detail"].lower()


@pytest.mark.django_db
def test_get_detector_detail_unauthenticated():
    """GET /detector/<id>/ - requires authentication"""
    client = APIClient()
    response = client.get("/api/detector/00000000-0000-0000-0000-000000000000/")
    assert response.status_code in [401, 403]
