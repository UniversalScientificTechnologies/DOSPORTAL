import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from DOSPORTAL.models import DetectorType, DetectorManufacturer

@pytest.mark.django_db
def test_get_detector_type_detail_success():
    user = User.objects.create_user(username='admin', password='pass12345')
    manufacturer = DetectorManufacturer.objects.create(name='Manuf', url='http://manuf.com')
    dtype = DetectorType.objects.create(name='TypeA', manufacturer=manufacturer)
    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get(f'/api/detector-type/{dtype.id}/')
    assert response.status_code == 200
    assert response.data['id'] == str(dtype.id)
    assert response.data['name'] == 'TypeA'
    assert response.data['manufacturer']['id'] == str(manufacturer.id)

@pytest.mark.django_db
def test_get_detector_type_detail_not_found():
    user = User.objects.create_user(username='admin', password='pass12345')
    client = APIClient()
    client.force_authenticate(user=user)
    import uuid
    fake_id = uuid.uuid4()
    response = client.get(f'/api/detector-type/{fake_id}/')
    assert response.status_code == 404
    assert 'detail' in response.data
