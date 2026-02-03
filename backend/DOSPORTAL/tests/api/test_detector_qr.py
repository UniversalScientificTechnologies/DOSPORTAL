import pytest
from rest_framework.test import APIClient
from DOSPORTAL.models import (
    Detector,
    DetectorType,
    DetectorManufacturer,
    Organization,
    User,
)


@pytest.mark.django_db
def test_get_detector_qr_code_success():
    """GET /detector/{detector_id}/qr/ - success"""
    # Setup
    user = User.objects.create_user(username="user1", password="pass123")
    manuf = DetectorManufacturer.objects.create(name="Sony", url="http://sony.com")
    dtype = DetectorType.objects.create(name="Gamma", manufacturer=manuf)
    org = Organization.objects.create(name="TestOrg")
    detector = Detector.objects.create(
        name="Test Detector",
        type=dtype,
        owner=org,
        sn="SN123",
    )

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get(f"/api/detector/{detector.id}/qr/")
    assert response.status_code == 200
    # QR code returns image/png content
    assert response["Content-Type"] == "image/png"


@pytest.mark.django_db
def test_get_detector_qr_code_with_label():
    """GET /detector/{detector_id}/qr/?label=true - success with label"""
    # Setup
    user = User.objects.create_user(username="user1", password="pass123")
    manuf = DetectorManufacturer.objects.create(name="Sony", url="http://sony.com")
    dtype = DetectorType.objects.create(name="Gamma", manufacturer=manuf)
    org = Organization.objects.create(name="TestOrg")
    detector = Detector.objects.create(
        name="Test Detector",
        type=dtype,
        owner=org,
        sn="SN123",
    )

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get(f"/api/detector/{detector.id}/qr/?label=true")
    assert response.status_code == 200
    assert response["Content-Type"] == "image/png"


@pytest.mark.django_db
def test_get_detector_qr_code_not_found():
    """GET /detector/{detector_id}/qr/ - non-existent detector"""
    user = User.objects.create_user(username="user1", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get("/api/detector/00000000-0000-0000-0000-000000000000/qr/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_get_detector_qr_code_unauthorized():
    """GET /detector/{detector_id}/qr/ - unauthorized"""
    # Setup
    manuf = DetectorManufacturer.objects.create(name="Sony", url="http://sony.com")
    dtype = DetectorType.objects.create(name="Gamma", manufacturer=manuf)
    org = Organization.objects.create(name="TestOrg")
    detector = Detector.objects.create(
        name="Test Detector",
        type=dtype,
        owner=org,
        sn="SN123",
    )

    client = APIClient()
    response = client.get(f"/api/detector/{detector.id}/qr/")
    assert response.status_code == 401
