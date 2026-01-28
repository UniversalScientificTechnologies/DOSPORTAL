import pytest
from rest_framework.test import APIClient
import json

@pytest.mark.django_db
def test_openapi_schema_available():
    client = APIClient()
    response = client.get("/api/schema/")
    assert response.status_code == 200