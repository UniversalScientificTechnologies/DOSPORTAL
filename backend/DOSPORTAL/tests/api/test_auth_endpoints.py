import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_signup_success():
    client = APIClient()
    response = client.post('/api/signup/', {
        'username': 'testuser',
        'password': 'strongpassword',
        'password_confirm': 'strongpassword',
        'email': 'test@example.com'
    }, format='json')
    assert response.status_code == 201
    assert 'token' in response.data

@pytest.mark.django_db
def test_signup_missing_fields():
    client = APIClient()
    response = client.post('/api/signup/', {
        'username': '',
        'password': '',
        'password_confirm': ''
    }, format='json')
    assert response.status_code == 400

@pytest.mark.django_db
def test_signup_passwords_do_not_match():
    client = APIClient()
    response = client.post('/api/signup/', {
        'username': 'user2',
        'password': 'password1',
        'password_confirm': 'password2'
    }, format='json')
    assert response.status_code == 400
    assert 'Passwords do not match' in response.data['detail']

@pytest.mark.django_db
def test_signup_password_too_short():
    client = APIClient()
    response = client.post('/api/signup/', {
        'username': 'user3',
        'password': 'short',
        'password_confirm': 'short'
    }, format='json')
    assert response.status_code == 400
    assert 'Password must be at least 8 characters' in response.data['detail']

@pytest.mark.django_db
def test_signup_existing_username():
    User.objects.create_user(username='existing', password='password123')
    client = APIClient()
    response = client.post('/api/signup/', {
        'username': 'existing',
        'password': 'password123',
        'password_confirm': 'password123'
    }, format='json')
    assert response.status_code == 400
    assert 'Username already exists' in response.data['detail']

@pytest.mark.django_db
def test_login_success():
    User.objects.create_user(username='loginuser', password='loginpass123')
    client = APIClient()
    response = client.post('/api/login/', {
        'username': 'loginuser',
        'password': 'loginpass123'
    }, format='json')
    assert response.status_code == 200
    assert 'token' in response.data

@pytest.mark.django_db
def test_login_wrong_password():
    User.objects.create_user(username='loginuser2', password='rightpass')
    client = APIClient()
    response = client.post('/api/login/', {
        'username': 'loginuser2',
        'password': 'wrongpass'
    }, format='json')
    assert response.status_code == 401

@pytest.mark.django_db
def test_login_nonexistent_user():
    client = APIClient()
    response = client.post('/api/login/', {
        'username': 'nouser',
        'password': 'nopass'
    }, format='json')
    assert response.status_code == 401

@pytest.mark.django_db
def test_login_missing_fields():
    client = APIClient()
    response = client.post('/api/login/', {
        'username': '',
        'password': ''
    }, format='json')
    assert response.status_code == 400

@pytest.mark.django_db
def test_logout_success():
    user = User.objects.create_user(username='logoutuser', password='logoutpass123')
    client = APIClient()
    login_response = client.post('/api/login/', {
        'username': 'logoutuser',
        'password': 'logoutpass123'
    }, format='json')
    token = login_response.data['token']
    client.credentials(HTTP_AUTHORIZATION='Token ' + token)
    response = client.post('/api/logout/')
    assert response.status_code == 200

@pytest.mark.django_db
def test_logout_no_token():
    client = APIClient()
    response = client.post('/api/logout/')
    assert response.status_code in [401, 403]

@pytest.mark.django_db
def test_token_validity_success():
    user = User.objects.create_user(username='validuser', password='validpass123')
    client = APIClient()
    login_response = client.post('/api/login/', {
        'username': 'validuser',
        'password': 'validpass123'
    }, format='json')
    token = login_response.data['token']
    client.credentials(HTTP_AUTHORIZATION='Token ' + token)
    response = client.get('/api/user/profile/')
    assert response.status_code == 200
    assert response.data['username'] == 'validuser'

@pytest.mark.django_db
def test_token_validity_invalid():
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION='Token invalidtoken')
    response = client.get('/api/user/profile/')
    assert response.status_code in [401, 403]
