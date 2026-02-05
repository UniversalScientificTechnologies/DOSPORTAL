import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_openapi_schema_available():
    client = APIClient()
    response = client.get("/api/schema/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_openapi_schema_contains_endpoints():
    """Test that OpenAPI schema contains key endpoints with proper documentation."""
    client = APIClient()
    response = client.get("/api/schema/", HTTP_ACCEPT="application/json")
    assert response.status_code == 200

    schema = response.json()

    # Test schema structure
    assert "openapi" in schema, "Schema should have openapi version"
    assert "info" in schema, "Schema should have info section"
    assert "paths" in schema, "Schema should have paths"

    # Test that key endpoints are documented
    paths = schema.get("paths", {})

    # Check authentication endpoints
    assert "/api/login/" in paths, "Login endpoint should be documented"
    assert "/api/signup/" in paths, "Signup endpoint should be documented"

    # Check organization endpoints
    assert (
        "/api/organizations/" in paths
    ), "Organizations list endpoint should be documented"
    assert (
        "/api/organizations/{org_id}/" in paths
    ), "Organization detail endpoint should be documented"
    assert (
        "/api/organizations/{org_id}/member/" in paths
    ), "Organization member endpoint should be documented"

    # Test login endpoint has proper documentation
    login_endpoint = paths.get("/api/login/")
    assert login_endpoint is not None
    assert "post" in login_endpoint, "Login should have POST method"

    post_op = login_endpoint["post"]
    assert "requestBody" in post_op, "POST /login should have requestBody documentation"
    assert "responses" in post_op, "POST /login should have responses documentation"
    assert (
        "200" in post_op["responses"] or "201" in post_op["responses"]
    ), "Login should document success response"


@pytest.mark.django_db
def test_openapi_schema_has_tags():
    client = APIClient()
    response = client.get("/api/schema/", HTTP_ACCEPT="application/json")
    assert response.status_code == 200

    schema = response.json()
    paths = schema.get("paths", {})

    # Check that at least one endpoint has tags
    has_tags = False
    for path, methods in paths.items():
        for method, operation in methods.items():
            if isinstance(operation, dict) and "tags" in operation:
                has_tags = True
                break
        if has_tags:
            break

    assert has_tags, "At least one endpoint should have tags for organization"
