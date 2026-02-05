import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from DOSPORTAL.models import DetectorManufacturer

@pytest.mark.django_db
def test_create_detector_type_success():
    user = User.objects.create_user(username='admin', password='pass12345')
    manufacturer = DetectorManufacturer.objects.create(name='Manuf', url='http://manuf.com')
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        'name': 'TypeA',
        'manufacturer': str(manufacturer.id),
        'url': 'http://typea.com',
        'description': 'Test type'
    }
    response = client.post('/api/detector-type/', data, format='json')
    assert response.status_code == 201
    assert response.data['name'] == 'TypeA'
    assert response.data['manufacturer']['id'] == str(manufacturer.id)

@pytest.mark.django_db
def test_create_detector_type_missing_name():
    user = User.objects.create_user(username='admin', password='pass12345')
    manufacturer = DetectorManufacturer.objects.create(name='Manuf', url='http://manuf.com')
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        'manufacturer': str(manufacturer.id),
        'url': 'http://typea.com',
        'description': 'Test type'
    }
    response = client.post('/api/detector-type/', data, format='json')
    assert response.status_code == 400
    assert 'name' in response.data
