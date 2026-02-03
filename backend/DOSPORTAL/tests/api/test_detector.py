import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from DOSPORTAL.models import Organization, OrganizationUser, DetectorType, DetectorManufacturer


@pytest.mark.django_db
def test_create_detector_success():
    # Setup user, org, manufacturer, type
    user = User.objects.create_user(username='admin', password='pass12345')
    org = Organization.objects.create(name='Test Org')
    OrganizationUser.objects.create(user=user, organization=org, user_type='OW')
    manufacturer = DetectorManufacturer.objects.create(name='Manufa', url='http://manuf.com')
    dtype = DetectorType.objects.create(name='TypeX', manufacturer=manufacturer)
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        'sn': 'SN001',
        'name': 'Detector1',
        'type_id': str(dtype.id),
        'owner': str(org.id)
    }
    response = client.post('/api/detector/', data, format='json')
    assert response.status_code == 201
    assert response.data['name'] == 'Detector1'
    assert response.data['owner'] == str(org.id)

@pytest.mark.django_db
def test_create_detector_no_permission():
    user = User.objects.create_user(username='user', password='pass12345')
    org = Organization.objects.create(name='Test Org')
    manufacturer = DetectorManufacturer.objects.create(name='Manuf', url='http://manuf.com')
    dtype = DetectorType.objects.create(name='Type1', manufacturer=manufacturer)
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        'sn': 'SN002',
        'name': 'Detector2',
        'type_id': str(dtype.id),
        'owner': str(org.id)
    }
    response = client.post('/api/detector/', data, format='json')
    assert response.status_code == 403
    assert 'permission' in response.data['detail']

@pytest.mark.django_db
def test_create_detector_invalid_org():
    user = User.objects.create_user(username='admin2', password='pass12345')
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        'sn': 'SN003',
        'name': 'Detector3',
        'type_id': None,
        'owner': '00000000-0000-0000-0000-000000000000'
    }
    response = client.post('/api/detector/', data, format='json')
    assert response.status_code == 404
    assert 'Organization not found' in response.data['detail']

@pytest.mark.django_db
def test_create_detector_missing_owner():
    user = User.objects.create_user(username='admin3', password='pass12345')
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        'sn': 'SN004',
        'name': 'Detector4',
        'type_id': None
    }
    response = client.post('/api/detector/', data, format='json')
    assert response.status_code == 400
    assert 'Owner organization is required' in response.data['detail']

@pytest.mark.django_db
def test_create_detector_owner_in_other_org():
    user = User.objects.create_user(username='owner_other', password='pass12345')
    org1 = Organization.objects.create(name='Org1')
    org2 = Organization.objects.create(name='Org2')
    OrganizationUser.objects.create(user=user, organization=org1, user_type='OW')
    manufacturer = DetectorManufacturer.objects.create(name='Manuf', url='http://manuf.com')
    dtype = DetectorType.objects.create(name='Type1', manufacturer=manufacturer)
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        'sn': 'SN005',
        'name': 'Detector5',
        'type_id': str(dtype.id),
        'owner': str(org2.id)
    }
    response = client.post('/api/detector/', data, format='json')
    assert response.status_code == 403
    assert 'permission' in response.data['detail']

@pytest.mark.django_db
def test_create_detector_member_only():
    user = User.objects.create_user(username='member', password='pass12345')
    org = Organization.objects.create(name='Test Org')
    OrganizationUser.objects.create(user=user, organization=org, user_type='ME')
    manufacturer = DetectorManufacturer.objects.create(name='Manuf', url='http://manuf.com')
    dtype = DetectorType.objects.create(name='Type1', manufacturer=manufacturer)
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        'sn': 'SN006',
        'name': 'Detector6',
        'type_id': str(dtype.id),
        'owner': str(org.id)
    }
    response = client.post('/api/detector/', data, format='json')
    assert response.status_code == 403
    assert 'permission' in response.data['detail']

@pytest.mark.django_db
def test_create_detector_invalid_data():
    user = User.objects.create_user(username='admin4', password='pass12345')
    org = Organization.objects.create(name='Test Org')
    OrganizationUser.objects.create(user=user, organization=org, user_type='OW')
    client = APIClient()
    client.force_authenticate(user=user)
    data = {
        'sn': '',  # Missing required fields
        'name': '',
        'type_id': '',
        'owner': str(org.id)
    }
    response = client.post('/api/detector/', data, format='json')
    assert response.status_code == 400
    assert 'sn' in response.data or 'name' in response.data or 'type' in response.data
