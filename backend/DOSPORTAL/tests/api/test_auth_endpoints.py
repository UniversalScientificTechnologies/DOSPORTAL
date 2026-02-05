import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User


@pytest.mark.django_db
def test_signup_success():
    client = APIClient()
    response = client.post(
        "/api/signup/",
        {
            "username": "testuser",
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "password": "strongpassword",
            "password_confirm": "strongpassword",
        },
        format="json",
    )
    assert response.status_code == 201
    assert "token" not in response.data
    assert "Awaiting admin approval" in response.data["detail"]

    user = User.objects.get(username="testuser")
    assert user.is_active is False
    assert user.first_name == "Test"
    assert user.last_name == "User"
    assert user.email == "test@example.com"


@pytest.mark.django_db
def test_signup_missing_fields():
    client = APIClient()
    response = client.post(
        "/api/signup/",
        {
            "username": "",
            "first_name": "",
            "last_name": "",
            "email": "",
            "password": "",
            "password_confirm": "",
        },
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_signup_passwords_do_not_match():
    client = APIClient()
    response = client.post(
        "/api/signup/",
        {
            "username": "user2",
            "first_name": "User",
            "last_name": "Two",
            "email": "user2@example.com",
            "password": "password1",
            "password_confirm": "password2",
        },
        format="json",
    )
    assert response.status_code == 400
    assert "Passwords do not match" in response.data["detail"]


@pytest.mark.django_db
def test_signup_password_too_short():
    client = APIClient()
    response = client.post(
        "/api/signup/",
        {
            "username": "user3",
            "first_name": "User",
            "last_name": "Three",
            "email": "user3@example.com",
            "password": "short",
            "password_confirm": "short",
        },
        format="json",
    )
    assert response.status_code == 400
    assert "Password must be at least 8 characters" in response.data["detail"]


@pytest.mark.django_db
def test_signup_existing_username():
    User.objects.create_user(
        username="existing", password="password123", email="existing@example.com"
    )
    client = APIClient()
    response = client.post(
        "/api/signup/",
        {
            "username": "existing",
            "first_name": "Existing",
            "last_name": "User",
            "email": "new@example.com",
            "password": "password123",
            "password_confirm": "password123",
        },
        format="json",
    )
    assert response.status_code == 400
    assert "Username already exists" in response.data["detail"]


@pytest.mark.django_db
def test_signup_existing_email():
    User.objects.create_user(
        username="user1", password="password123", email="taken@example.com"
    )
    client = APIClient()
    response = client.post(
        "/api/signup/",
        {
            "username": "newuser",
            "first_name": "New",
            "last_name": "User",
            "email": "taken@example.com",
            "password": "password123",
            "password_confirm": "password123",
        },
        format="json",
    )
    assert response.status_code == 400
    assert "Email already exists" in response.data["detail"]


@pytest.mark.django_db
def test_login_success():
    User.objects.create_user(
        username="loginuser", password="loginpass123", is_active=True
    )
    client = APIClient()
    response = client.post(
        "/api/login/",
        {"username": "loginuser", "password": "loginpass123"},
        format="json",
    )
    assert response.status_code == 200
    assert "token" in response.data


@pytest.mark.django_db
def test_login_wrong_password():
    User.objects.create_user(
        username="loginuser2", password="rightpass", is_active=True
    )
    client = APIClient()
    response = client.post(
        "/api/login/",
        {"username": "loginuser2", "password": "wrongpass"},
        format="json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_login_not_active_fail():
    User.objects.create_user(
        username="inactiveuser", password="correctpass123", is_active=False
    )
    client = APIClient()
    response = client.post(
        "/api/login/",
        {"username": "inactiveuser", "password": "correctpass123"},
        format="json",
    )
    assert response.status_code == 403
    assert "has not been approved" in response.data["detail"]


@pytest.mark.django_db
def test_login_is_active_success():
    User.objects.create_user(
        username="activeuser", password="activepass123", is_active=True
    )
    client = APIClient()
    response = client.post(
        "/api/login/",
        {"username": "activeuser", "password": "activepass123"},
        format="json",
    )
    assert response.status_code == 200
    assert "token" in response.data
    assert response.data["username"] == "activeuser"


@pytest.mark.django_db
def test_login_nonexistent_user():
    client = APIClient()
    response = client.post(
        "/api/login/", {"username": "nouser", "password": "nopass"}, format="json"
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_login_missing_fields():
    client = APIClient()
    response = client.post(
        "/api/login/", {"username": "", "password": ""}, format="json"
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_logout_success():
    user = User.objects.create_user(
        username="logoutuser", password="logoutpass123", is_active=True
    )
    client = APIClient()
    login_response = client.post(
        "/api/login/",
        {"username": "logoutuser", "password": "logoutpass123"},
        format="json",
    )
    token = login_response.data["token"]
    client.credentials(HTTP_AUTHORIZATION="Token " + token)
    response = client.post("/api/logout/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_logout_no_token():
    client = APIClient()
    response = client.post("/api/logout/")
    assert response.status_code in [401, 403]


@pytest.mark.django_db
def test_token_validity_success():
    user = User.objects.create_user(
        username="validuser", password="validpass123", is_active=True
    )
    client = APIClient()
    login_response = client.post(
        "/api/login/",
        {"username": "validuser", "password": "validpass123"},
        format="json",
    )
    token = login_response.data["token"]
    client.credentials(HTTP_AUTHORIZATION="Token " + token)
    response = client.get("/api/user/profile/")
    assert response.status_code == 200
    assert response.data["username"] == "validuser"


@pytest.mark.django_db
def test_token_validity_invalid():
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION="Token invalidtoken")
    response = client.get("/api/user/profile/")
    assert response.status_code in [401, 403]
