import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User

from DOSPORTAL.models import Measurement, MeasurementSegment, Organization, OrganizationUser
from DOSPORTAL.models.spectrals import SpectralRecord


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="owner", password="pass")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(username="other", password="pass")


@pytest.fixture
def measurement(db, user):
    return Measurement.objects.create(name="Test measurement", author=user)


@pytest.fixture
def spectral_record(db, user):
    return SpectralRecord.objects.create(name="Record A", author=user)


@pytest.fixture
def segment(db, measurement, spectral_record):
    return MeasurementSegment.objects.create(
        measurement=measurement,
        spectral_record=spectral_record,
        position=0,
    )


@pytest.mark.django_db
def test_patch_segment_updates_time_range(api_client, user, segment):
    api_client.force_authenticate(user=user)
    response = api_client.patch(
        f"/api/measurement-segments/{segment.id}/",
        {"time_from": "2024-01-01T10:00:00Z", "time_to": "2024-01-01T11:00:00Z"},
        format="json",
    )
    assert response.status_code == 200
    segment.refresh_from_db()
    assert str(segment.time_from) != str(None)
    assert str(segment.time_to) != str(None)


@pytest.mark.django_db
def test_delete_segment(api_client, user, segment):
    api_client.force_authenticate(user=user)
    segment_id = segment.id
    response = api_client.delete(f"/api/measurement-segments/{segment_id}/")
    assert response.status_code == 204
    assert not MeasurementSegment.objects.filter(id=segment_id).exists()


@pytest.mark.django_db
def test_delete_segment_forbidden_for_non_author(api_client, other_user, segment):
    api_client.force_authenticate(user=other_user)
    response = api_client.delete(f"/api/measurement-segments/{segment.id}/")
    assert response.status_code in (403, 404)
    assert MeasurementSegment.objects.filter(id=segment.id).exists()


@pytest.mark.django_db
def test_list_segments_filtered_by_measurement(
    api_client, user, measurement, spectral_record
):
    other_measurement = Measurement.objects.create(name="Other", author=user)
    seg_a = MeasurementSegment.objects.create(
        measurement=measurement, spectral_record=spectral_record, position=0
    )
    seg_b = MeasurementSegment.objects.create(
        measurement=other_measurement, spectral_record=spectral_record, position=0
    )

    api_client.force_authenticate(user=user)
    response = api_client.get(
        f"/api/measurement-segments/?measurement={measurement.id}"
    )
    assert response.status_code == 200
    ids = {s["id"] for s in response.json()["results"]}
    assert str(seg_a.id) in ids
    assert str(seg_b.id) not in ids
