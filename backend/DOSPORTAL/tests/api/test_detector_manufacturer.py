import pytest
from rest_framework.test import APIClient
from DOSPORTAL.models import DetectorManufacturer


@pytest.mark.django_db
def test_get_manufacturers_empty():
    """GET /detector-manufacturer/ - empty list"""
    client = APIClient()
    response = client.get("/api/detector-manufacturer/")
    assert response.status_code == 200
    assert response.data == []


@pytest.mark.django_db
def test_get_manufacturers_with_data():
    """GET /detector-manufacturer/ - with existing manufacturers"""
    # Setup
    DetectorManufacturer.objects.create(name="Sony", url="http://sony.com")
    DetectorManufacturer.objects.create(name="Bosch", url="http://bosch.com")

    client = APIClient()
    response = client.get("/api/detector-manufacturer/")
    assert response.status_code == 200
    assert len(response.data) == 2
    names = [item["name"] for item in response.data]
    assert "Sony" in names
    assert "Bosch" in names


@pytest.mark.django_db
def test_get_manufacturer_detail_success():
    """GET /detector-manufacturer/{id}/ - existing manufacturer"""
    # Setup
    manuf = DetectorManufacturer.objects.create(
        name="Samsung", url="http://samsung.com"
    )

    client = APIClient()
    response = client.get(f"/api/detector-manufacturer/{manuf.id}/")
    assert response.status_code == 200
    assert response.data["name"] == "Samsung"
    assert response.data["url"] == "http://samsung.com"
    assert str(response.data["id"]) == str(manuf.id)


@pytest.mark.django_db
def test_get_manufacturer_detail_not_found():
    """GET /detector-manufacturer/{id}/ - non-existent manufacturer"""
    client = APIClient()
    response = client.get(
        "/api/detector-manufacturer/00000000-0000-0000-0000-000000000000/"
    )
    assert response.status_code == 404
    assert "Not found" in response.data["detail"]


@pytest.mark.django_db
def test_create_manufacturer_success():
    """POST /detector-manufacturer/ - create with valid data"""
    client = APIClient()
    data = {"name": "LG Electronics", "url": "http://lg.com"}
    response = client.post("/api/detector-manufacturer/", data, format="json")
    assert response.status_code == 201
    assert response.data["name"] == "LG Electronics"
    assert response.data["url"] == "http://lg.com"
    assert "id" in response.data

    # Verify it was created
    assert DetectorManufacturer.objects.filter(name="LG Electronics").exists()


@pytest.mark.django_db
def test_create_manufacturer_minimal():
    """POST /detector-manufacturer/ - create with name and url"""
    client = APIClient()
    data = {"name": "HP", "url": "https://hp.com"}
    response = client.post("/api/detector-manufacturer/", data, format="json")
    assert response.status_code == 201
    assert response.data["name"] == "HP"
    assert response.data["name"] == "HP"


@pytest.mark.django_db
def test_create_manufacturer_missing_name():
    """POST /detector-manufacturer/ - missing required name field"""
    client = APIClient()
    data = {"url": "http://example.com"}
    response = client.post("/api/detector-manufacturer/", data, format="json")
    assert response.status_code == 400
    assert "name" in response.data or "name" in str(response.data)


@pytest.mark.django_db
def test_create_manufacturer_empty_data():
    """POST /detector-manufacturer/ - empty data"""
    client = APIClient()
    response = client.post("/api/detector-manufacturer/", {}, format="json")
    assert response.status_code == 400
