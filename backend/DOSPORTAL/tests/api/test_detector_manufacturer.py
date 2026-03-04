import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from DOSPORTAL.models import DetectorManufacturer

LIST_URL = "/api/detector-manufacturers/"


def detail_url(pk):
    return f"/api/detector-manufacturers/{pk}/"


@pytest.fixture
def user(db):
    return User.objects.create_user(username="testuser", password="testpass")


@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_get_manufacturers_empty():
    client = APIClient()
    response = client.get(LIST_URL)
    assert response.status_code == 200
    assert response.data["count"] == 0
    assert response.data["results"] == []


@pytest.mark.django_db
def test_get_manufacturers_with_data():
    DetectorManufacturer.objects.create(name="Sony", url="http://sony.com")
    DetectorManufacturer.objects.create(name="Bosch", url="http://bosch.com")

    client = APIClient()
    response = client.get(LIST_URL)
    assert response.status_code == 200
    assert response.data["count"] == 2
    names = [item["name"] for item in response.data["results"]]
    assert "Sony" in names
    assert "Bosch" in names


@pytest.mark.django_db
def test_get_manufacturer_detail_success():
    manuf = DetectorManufacturer.objects.create(name="Samsung", url="http://samsung.com")

    client = APIClient()
    response = client.get(detail_url(manuf.id))
    assert response.status_code == 200
    assert response.data["name"] == "Samsung"
    assert response.data["url"] == "http://samsung.com"
    assert str(response.data["id"]) == str(manuf.id)


@pytest.mark.django_db
def test_get_manufacturer_detail_not_found():
    client = APIClient()
    response = client.get(detail_url("00000000-0000-0000-0000-000000000000"))
    assert response.status_code == 404


@pytest.mark.django_db
def test_create_manufacturer_success(auth_client):
    response = auth_client.post(LIST_URL, {"name": "LG Electronics", "url": "http://lg.com"}, format="json")
    assert response.status_code == 201
    assert response.data["name"] == "LG Electronics"
    assert response.data["url"] == "http://lg.com"
    assert "id" in response.data
    assert DetectorManufacturer.objects.filter(name="LG Electronics").exists()


@pytest.mark.django_db
def test_create_manufacturer_minimal(auth_client):
    response = auth_client.post(LIST_URL, {"name": "HP", "url": "https://hp.com"}, format="json")
    assert response.status_code == 201
    assert response.data["name"] == "HP"


@pytest.mark.django_db
def test_create_manufacturer_missing_name(auth_client):
    response = auth_client.post(LIST_URL, {"url": "http://example.com"}, format="json")
    assert response.status_code == 400
    assert "name" in response.data


@pytest.mark.django_db
def test_create_manufacturer_missing_url(auth_client):
    response = auth_client.post(LIST_URL, {"name": "NoURL Corp"}, format="json")
    assert response.status_code == 400
    assert "url" in response.data


@pytest.mark.django_db
def test_create_manufacturer_empty_data(auth_client):
    response = auth_client.post(LIST_URL, {}, format="json")
    assert response.status_code == 400
    assert "name" in response.data


@pytest.mark.django_db
def test_create_manufacturer_unauthenticated():
    client = APIClient()
    response = client.post(LIST_URL, {"name": "Ghost Corp", "url": "http://ghost.com"}, format="json")
    assert response.status_code == 401
