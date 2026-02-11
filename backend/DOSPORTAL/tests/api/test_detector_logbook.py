import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User

from DOSPORTAL.models import (
    Detector,
    DetectorType,
    DetectorManufacturer,
    DetectorLogbook,
    Organization,
    OrganizationUser,
)


@pytest.mark.django_db
def test_logbook_get_empty():
    """GET /logbook/ - empty list"""
    user = User.objects.create_user(username="user1", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/logbook/")

    assert response.status_code == 200
    assert response.data == []


@pytest.mark.django_db
def test_logbook_get_filtered_by_detector_and_type():
    """GET /logbook/ - filter by detector and entry_type"""
    user = User.objects.create_user(username="user1", password="pass123")
    manuf = DetectorManufacturer.objects.create(name="Sony", url="http://sony.com")
    dtype = DetectorType.objects.create(name="Gamma", manufacturer=manuf)
    org = Organization.objects.create(name="TestOrg")

    detector1 = Detector.objects.create(
        name="Detector 1", type=dtype, owner=org, sn="SN1"
    )
    detector2 = Detector.objects.create(
        name="Detector 2", type=dtype, owner=org, sn="SN2"
    )

    DetectorLogbook.objects.create(
        detector=detector1,
        author=user,
        text="Maintenance done",
        entry_type="maintenance",
    )
    DetectorLogbook.objects.create(
        detector=detector2,
        author=user,
        text="Note entry",
        entry_type="note",
    )

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get(
        f"/api/logbook/?detector={detector1.id}&entry_type=maintenance"
    )

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["text"] == "Maintenance done"


@pytest.mark.django_db
def test_logbook_post_success():
    """POST /logbook/add/ - create logbook entry"""
    user = User.objects.create_user(username="user1", password="pass123")
    manuf = DetectorManufacturer.objects.create(name="Sony", url="http://sony.com")
    dtype = DetectorType.objects.create(name="Gamma", manufacturer=manuf)
    org = Organization.objects.create(name="TestOrg")
    OrganizationUser.objects.create(user=user, organization=org, user_type="OW")

    detector = Detector.objects.create(
        name="Detector 1", type=dtype, owner=org, sn="SN1"
    )

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.post(
        "/api/logbook/add/",
        {"detector": str(detector.id), "text": "Created entry", "entry_type": "note"},
        format="json",
    )

    assert response.status_code == 201
    assert str(response.data["detector"]) == str(detector.id)
    assert response.data["text"] == "Created entry"


@pytest.mark.django_db
def test_logbook_put_success():
    """PUT /logbook/{entry_id}/ - update logbook entry"""
    user = User.objects.create_user(username="user1", password="pass123")
    manuf = DetectorManufacturer.objects.create(name="Sony", url="http://sony.com")
    dtype = DetectorType.objects.create(name="Gamma", manufacturer=manuf)
    org = Organization.objects.create(name="TestOrg")
    OrganizationUser.objects.create(user=user, organization=org, user_type="OW")

    detector = Detector.objects.create(
        name="Detector 1", type=dtype, owner=org, sn="SN1"
    )
    entry = DetectorLogbook.objects.create(
        detector=detector,
        author=user,
        text="Initial entry",
        entry_type="note",
    )

    client = APIClient()
    client.force_authenticate(user=user)
    response = client.put(
        f"/api/logbook/{entry.id}/",
        {"text": "Updated entry", "entry_type": "reset"},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["text"] == "Updated entry"
    assert response.data["entry_type"] == "reset"
