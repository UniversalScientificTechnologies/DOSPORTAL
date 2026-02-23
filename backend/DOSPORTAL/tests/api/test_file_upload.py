"""Tests for file upload API."""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User

from DOSPORTAL.models import File, Organization, OrganizationUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def owner_user(db):
    return User.objects.create_user(
        username='owner',
        email='owner@test.com',
        password='testpass123'
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username='admin',
        email='admin@test.com',
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
        slug='test-org',
        data_policy='PU'
    )


@pytest.fixture
def org_with_members(db, organization, owner_user, admin_user, member_user):
    OrganizationUser.objects.create(
        user=owner_user,
        organization=organization,
        user_type='OW'
    )
    OrganizationUser.objects.create(
        user=admin_user,
        organization=organization,
        user_type='AD'
    )
    OrganizationUser.objects.create(
        user=member_user,
        organization=organization,
        user_type='ME'
    )
    return organization


@pytest.mark.django_db
class TestFileUploadAPI:
    
    def test_requires_authentication(self, api_client):
        file_content = SimpleUploadedFile("test.txt", b"test", content_type="text/plain")
        response = api_client.post(
            '/api/file/upload/',
            {'filename': 'test.txt', 'file': file_content, 'file_type': 'log'},
            format='multipart'
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_upload_without_organization(self, api_client, owner_user):
        api_client.force_authenticate(user=owner_user)
        file_content = SimpleUploadedFile("test.txt", b"test content", content_type="text/plain")
        
        response = api_client.post(
            '/api/file/upload/',
            {'filename': 'test.txt', 'file': file_content, 'file_type': 'log'},
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['filename'] == 'test.txt'
        assert response.data['file_type'] == 'log'
        assert response.data['size'] > 0
        
        file_obj = File.objects.get(id=response.data['id'])
        assert file_obj.author == owner_user
        assert file_obj.owner is None
    
    def test_owner_can_upload_to_organization(self, api_client, owner_user, org_with_members):
        api_client.force_authenticate(user=owner_user)
        file_content = SimpleUploadedFile("org_file.txt", b"org content", content_type="text/plain")
        
        response = api_client.post(
            '/api/file/upload/',
            {
                'filename': 'org_file.txt',
                'file': file_content,
                'file_type': 'log',
                'owner': str(org_with_members.id)
            },
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        file_obj = File.objects.get(id=response.data['id'])
        assert file_obj.owner == org_with_members
    
    def test_admin_can_upload_to_organization(self, api_client, admin_user, org_with_members):
        api_client.force_authenticate(user=admin_user)
        file_content = SimpleUploadedFile("admin_file.txt", b"admin", content_type="text/plain")
        
        response = api_client.post(
            '/api/file/upload/',
            {
                'filename': 'admin_file.txt',
                'file': file_content,
                'file_type': 'document',
                'owner': str(org_with_members.id)
            },
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_member_cannot_upload_to_organization(self, api_client, member_user, org_with_members):
        api_client.force_authenticate(user=member_user)
        file_content = SimpleUploadedFile("member_file.txt", b"member", content_type="text/plain")
        
        response = api_client.post(
            '/api/file/upload/',
            {
                'filename': 'member_file.txt',
                'file': file_content,
                'file_type': 'log',
                'owner': str(org_with_members.id)
            },
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'permission' in response.data['error'].lower()
    
    def test_outsider_cannot_upload_to_organization(self, api_client, outsider_user, org_with_members):
        api_client.force_authenticate(user=outsider_user)
        file_content = SimpleUploadedFile("outsider.txt", b"outsider", content_type="text/plain")
        
        response = api_client.post(
            '/api/file/upload/',
            {
                'filename': 'outsider.txt',
                'file': file_content,
                'file_type': 'log',
                'owner': str(org_with_members.id)
            },
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_missing_file(self, api_client, owner_user):
        api_client.force_authenticate(user=owner_user)
        
        response = api_client.post(
            '/api/file/upload/',
            {'filename': 'missing.txt', 'file_type': 'log'},
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'no file' in response.data['error'].lower()
    
    def test_multiple_file_types(self, api_client, owner_user):
        api_client.force_authenticate(user=owner_user)
        
        for file_type in ['log', 'trajectory', 'document']:
            file_content = SimpleUploadedFile(
                f"{file_type}.txt",
                f"{file_type} content".encode(),
                content_type="text/plain"
            )
            response = api_client.post(
                '/api/file/upload/',
                {'filename': f'{file_type}.txt', 'file': file_content, 'file_type': file_type},
                format='multipart'
            )
            assert response.status_code == status.HTTP_201_CREATED
            assert response.data['file_type'] == file_type
