"""Tests for SpectralRecord API endpoints."""

import pytest
import tempfile
import os
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.base import ContentFile
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User

from DOSPORTAL.models import File, Organization, OrganizationUser
from DOSPORTAL.models.spectrals import SpectralRecord, SpectralRecordArtifact


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )


@pytest.fixture
def member_user(db):
    return User.objects.create_user(
        username='member',
        email='member@test.com',
        password='testpass123'
    )


@pytest.fixture
def outsider_user(db):
    return User.objects.create_user(
        username='outsider',
        email='outsider@test.com',
        password='testpass123'
    )


@pytest.fixture
def organization(db):
    return Organization.objects.create(
        name='Test Organization',
        slug='test-org'
    )


@pytest.fixture
def user_with_org(db, user, organization):
    OrganizationUser.objects.create(
        user=user, 
        organization=organization, 
        user_type='OW'
    )
    return user


@pytest.fixture
def org_with_members(db, organization, user_with_org, member_user):
    OrganizationUser.objects.create(
        user=member_user,
        organization=organization,
        user_type='ME'
    )
    return organization


@pytest.fixture
def sample_candy_log():
    spectrum1 = [5693, 14394, 329, 1] + [0] * 252
    spectrum2 = [5813, 14251, 321, 6, 1, 1] + [0] * 250
    spectrum3 = [6078, 14063, 278] + [0] * 253
    
    lines = [
        "$AIRDOS,F4,256,f157c1d,1290c00806a200925057a000a000006a",
        f"$CANDY,0,10,25583,1,256,0,{','.join(map(str, spectrum1))}",
        f"$CANDY,1,21,25606,9,256,0,{','.join(map(str, spectrum2))}",
        f"$CANDY,2,33,25580,1,256,0,{','.join(map(str, spectrum3))}"
    ]
    
    return "\n".join(lines)


@pytest.fixture
def log_file(db, organization, sample_candy_log):
    file_content = SimpleUploadedFile(
        "test_candy.txt",
        sample_candy_log.encode('utf-8'),
        content_type="text/plain"
    )
    
    return File.objects.create(
        filename='Test CANDY Log',
        file=file_content,
        file_type=File.FILE_TYPE_LOG,
        owner=organization,
        source_type="uploaded"
    )


@pytest.fixture
def spectral_record(db, log_file, user_with_org, organization):
    from django.utils import timezone
    
    return SpectralRecord.objects.create(
        name='Test Spectral Record',
        raw_file=log_file,
        author=user_with_org,
        owner=organization,
        description='Test record for histogram testing',
        processing_status=SpectralRecord.PROCESSING_PENDING,
        time_start=timezone.now()
    )


@pytest.fixture
def completed_spectral_record_with_artifact(db, spectral_record):
    import pandas as pd
    import uuid
    
    data = {
        'id': [0, 1, 2],
        'time_ms': [10, 21, 33], 
        'particle_count': [1, 9, 1],
        'channel_0': [5693, 5813, 6078],
        'channel_1': [14394, 14251, 14063],
        'channel_2': [329, 321, 278],
        'channel_3': [1, 6, 0],
        'channel_4': [0, 1, 0],
        'channel_5': [0, 1, 0],
        'channel_6': [0, 0, 0],
        'channel_7': [0, 0, 0],
        'channel_8': [0, 0, 0],
        'channel_9': [0, 1, 0],
    }
    df = pd.DataFrame(data)
    
    temp_file = tempfile.NamedTemporaryFile(suffix='.parquet', delete=False)
    df.to_parquet(temp_file.name, index=False)
    
    with open(temp_file.name, 'rb') as f:
        parquet_content = f.read()
    
    artifact_file = File.objects.create(
        filename=f'spectral_{spectral_record.id}.parquet',
        file=ContentFile(parquet_content, name=f'{uuid.uuid4()}.parquet'),
        file_type=File.FILE_TYPE_PARQUET,
        owner=spectral_record.owner,
        source_type="generated"
    )
    
    SpectralRecordArtifact.objects.create(
        spectral_record=spectral_record,
        artifact_type=SpectralRecordArtifact.SPECTRAL_FILE,
        artifact=artifact_file
    )
    
    spectral_record.processing_status = SpectralRecord.PROCESSING_COMPLETED
    spectral_record.save()
    
    os.unlink(temp_file.name)
    
    return spectral_record


@pytest.mark.django_db
class TestSpectralRecordListEndpoint:
    
    def test_list_requires_authentication(self, api_client):
        response = api_client.get('/api/spectral-record/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_member_sees_org_records(self, api_client, member_user, spectral_record, org_with_members):
        api_client.force_authenticate(user=member_user)
        response = api_client.get('/api/spectral-record/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == str(spectral_record.id)
    
    def test_outsider_does_not_see_org_records(self, api_client, outsider_user, spectral_record):
        api_client.force_authenticate(user=outsider_user)
        response = api_client.get('/api/spectral-record/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0
    
    def test_list_authenticated(self, api_client, user_with_org, spectral_record):
        api_client.force_authenticate(user=user_with_org)
        
        response = api_client.get('/api/spectral-record/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == str(spectral_record.id)
        assert response.data[0]['name'] == 'Test Spectral Record'
        assert response.data[0]['processing_status'] == SpectralRecord.PROCESSING_PENDING
        assert response.data[0]['artifacts_count'] == 0
    
    def test_list_multiple_records(self, api_client, user_with_org, log_file, organization):
        from django.utils import timezone
        
        api_client.force_authenticate(user=user_with_org)
        
        records = []
        for i in range(3):
            record = SpectralRecord.objects.create(
                name=f'Test Record {i}',
                raw_file=log_file,
                author=user_with_org,
                owner=organization,
                processing_status=SpectralRecord.PROCESSING_PENDING if i % 2 == 0 else SpectralRecord.PROCESSING_COMPLETED,
                time_start=timezone.now()
            )
            records.append(record)
        
        response = api_client.get('/api/spectral-record/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        
        statuses = [item['processing_status'] for item in response.data]
        assert SpectralRecord.PROCESSING_PENDING in statuses
        assert SpectralRecord.PROCESSING_COMPLETED in statuses
    
    def test_owner_field_returns_spectral_record_owner_name(self, api_client, user_with_org, organization, sample_candy_log):
        from django.utils import timezone
        
        api_client.force_authenticate(user=user_with_org)
        
        file_with_owner = File.objects.create(
            filename='Test Log with Owner',
            file=SimpleUploadedFile("test.txt", sample_candy_log.encode('utf-8'), content_type="text/plain"),
            file_type=File.FILE_TYPE_LOG,
            owner=organization,
            source_type="uploaded"
        )
        
        spectral_record = SpectralRecord.objects.create(
            name='Record with Owner',
            raw_file=file_with_owner,
            author=user_with_org,
            owner=organization,
            processing_status=SpectralRecord.PROCESSING_PENDING,
            time_start=timezone.now()
        )
        
        response = api_client.get('/api/spectral-record/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        
        record_data = next((r for r in response.data if r['id'] == str(spectral_record.id)), None)
        assert record_data is not None
        assert record_data['owner'] == organization.name
    
    def test_owner_field_null_when_no_spectral_record_owner(self, api_client, user_with_org, sample_candy_log):
        from django.utils import timezone
        
        api_client.force_authenticate(user=user_with_org)
        
        file_without_owner = File.objects.create(
            filename='Test Log without Owner',
            file=SimpleUploadedFile("test2.txt", sample_candy_log.encode('utf-8'), content_type="text/plain"),
            file_type=File.FILE_TYPE_LOG,
            owner=None,
            source_type="uploaded"
        )
        
        spectral_record = SpectralRecord.objects.create(
            name='Record without Owner',
            raw_file=file_without_owner,
            author=user_with_org,
            processing_status=SpectralRecord.PROCESSING_PENDING,
            time_start=timezone.now()
        )
        
        response = api_client.get('/api/spectral-record/')
        
        assert response.status_code == status.HTTP_200_OK
        
        record_data = next((r for r in response.data if r['id'] == str(spectral_record.id)), None)
        assert record_data is not None
        assert record_data['owner'] is None


@pytest.mark.django_db
class TestSpectralRecordCreateEndpoint:
    
    def test_create_unauthenticated(self, api_client, log_file):
        response = api_client.post('/api/spectral-record/create/', {
            'name': 'Test Record',
            'raw_file_id': str(log_file.id)
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_success(self, api_client, user_with_org, log_file):
        api_client.force_authenticate(user=user_with_org)
        
        data = {
            'name': 'New Spectral Record',
            'raw_file_id': str(log_file.id),
            'description': 'Test description'
        }
        
        response = api_client.post('/api/spectral-record/create/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Spectral Record'
        assert response.data['processing_status'] == SpectralRecord.PROCESSING_PENDING
        assert 'message' in response.data
        
        record = SpectralRecord.objects.get(id=response.data['id'])
        assert record.name == 'New Spectral Record'
        assert record.raw_file == log_file
        assert record.author == user_with_org
        assert record.owner == log_file.owner
    
    def test_create_missing_file_id(self, api_client, user_with_org):
        api_client.force_authenticate(user=user_with_org)
        
        data = {'name': 'Test Record'}
        
        response = api_client.post('/api/spectral-record/create/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'raw_file_id is required' in response.data['error']
    
    def test_create_invalid_file_id(self, api_client, user_with_org):
        api_client.force_authenticate(user=user_with_org)
        
        from uuid import uuid4
        data = {'name': 'Test Record', 'raw_file_id': str(uuid4())}
        
        response = api_client.post('/api/spectral-record/create/', data)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'not found' in response.data['error'].lower()
    
    def test_create_with_unauthorized_owner(self, api_client, outsider_user, log_file, organization):
        api_client.force_authenticate(user=outsider_user)
        
        data = {
            'name': 'Test Record',
            'raw_file_id': str(log_file.id),
            'owner': str(organization.id)
        }
        
        response = api_client.post('/api/spectral-record/create/', data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'permission' in response.data['error'].lower()
    
    def test_create_member_cannot_set_owner(self, api_client, member_user, log_file, org_with_members):
        api_client.force_authenticate(user=member_user)
        
        data = {
            'name': 'Test Record',
            'raw_file_id': str(log_file.id),
            'owner': str(org_with_members.id)
        }
        
        response = api_client.post('/api/spectral-record/create/', data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN





@pytest.mark.django_db
class TestSpectralRecordEvolutionEndpoint:

    def test_evolution_requires_authentication(self, api_client, completed_spectral_record_with_artifact):
        record = completed_spectral_record_with_artifact
        response = api_client.get(f'/api/spectral-record/{record.id}/evolution/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_evolution_success(self, api_client, completed_spectral_record_with_artifact, user_with_org):
        record = completed_spectral_record_with_artifact
        api_client.force_authenticate(user=user_with_org)

        response = api_client.get(f'/api/spectral-record/{record.id}/evolution/')

        assert response.status_code == status.HTTP_200_OK
        assert 'evolution_values' in response.data
        assert 'total_time' in response.data

        evolution = response.data['evolution_values']
        assert len(evolution) == 3
        for point in evolution:
            assert len(point) == 2
            assert isinstance(point[0], float)
            assert isinstance(point[1], float)

    def test_evolution_record_not_found(self, api_client, user_with_org):
        from uuid import uuid4
        api_client.force_authenticate(user=user_with_org)
        response = api_client.get(f'/api/spectral-record/{uuid4()}/evolution/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_evolution_processing_not_completed(self, api_client, spectral_record, user_with_org):
        api_client.force_authenticate(user=user_with_org)
        response = api_client.get(f'/api/spectral-record/{spectral_record.id}/evolution/')
        assert response.status_code == status.HTTP_425_TOO_EARLY

    def test_evolution_permission_denied(self, api_client, completed_spectral_record_with_artifact, outsider_user):
        record = completed_spectral_record_with_artifact
        api_client.force_authenticate(user=outsider_user)
        response = api_client.get(f'/api/spectral-record/{record.id}/evolution/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestSpectralRecordSpectrumEndpoint:

    def test_spectrum_requires_authentication(self, api_client, completed_spectral_record_with_artifact):
        record = completed_spectral_record_with_artifact
        response = api_client.get(f'/api/spectral-record/{record.id}/spectrum/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_spectrum_success(self, api_client, completed_spectral_record_with_artifact, user_with_org):
        record = completed_spectral_record_with_artifact
        api_client.force_authenticate(user=user_with_org)

        response = api_client.get(f'/api/spectral-record/{record.id}/spectrum/')

        assert response.status_code == status.HTTP_200_OK
        assert 'spectrum_values' in response.data
        assert 'total_time' in response.data
        assert 'calib' in response.data
        assert response.data['calib'] is False

        spectrum = response.data['spectrum_values']
        assert len(spectrum) == 10
        for point in spectrum:
            assert len(point) == 2
            assert isinstance(point[0], (int, float))
            assert isinstance(point[1], float)

    def test_spectrum_record_not_found(self, api_client, user_with_org):
        from uuid import uuid4
        api_client.force_authenticate(user=user_with_org)
        response = api_client.get(f'/api/spectral-record/{uuid4()}/spectrum/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_spectrum_processing_not_completed(self, api_client, spectral_record, user_with_org):
        api_client.force_authenticate(user=user_with_org)
        response = api_client.get(f'/api/spectral-record/{spectral_record.id}/spectrum/')
        assert response.status_code == status.HTTP_425_TOO_EARLY

    def test_spectrum_permission_denied(self, api_client, completed_spectral_record_with_artifact, outsider_user):
        record = completed_spectral_record_with_artifact
        api_client.force_authenticate(user=outsider_user)
        response = api_client.get(f'/api/spectral-record/{record.id}/spectrum/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
