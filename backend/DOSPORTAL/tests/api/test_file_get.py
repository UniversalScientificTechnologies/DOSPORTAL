"""Tests for file GET endpoints."""

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
def org_with_members(db, organization, owner_user, member_user):
    OrganizationUser.objects.create(
        user=owner_user,
        organization=organization,
        user_type='OW'
    )
    OrganizationUser.objects.create(
        user=member_user,
        organization=organization,
        user_type='ME'
    )
    return organization


@pytest.fixture
def sample_file(db, org_with_members, owner_user):
    file_content = SimpleUploadedFile(
        "test.txt",
        b"test content",
        content_type="text/plain"
    )
    return File.objects.create(
        filename='test.txt',
        file_type='log',
        file=file_content,
        author=owner_user,
        owner=org_with_members,
        size=12
    )


@pytest.mark.django_db
class TestFileDetail:
    
    def test_requires_authentication(self, api_client, sample_file):
        response = api_client.get(f'/api/file/{sample_file.id}/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_file_not_found(self, api_client, owner_user):
        api_client.force_authenticate(user=owner_user)
        response = api_client.get('/api/file/00000000-0000-0000-0000-000000000000/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'not found' in response.data['error'].lower()
    
    def test_member_can_access_org_file(self, api_client, member_user, sample_file):
        api_client.force_authenticate(user=member_user)
        response = api_client.get(f'/api/file/{sample_file.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['filename'] == 'test.txt'
    
    def test_outsider_cannot_access_org_file(self, api_client, outsider_user, sample_file):
        api_client.force_authenticate(user=outsider_user)
        response = api_client.get(f'/api/file/{sample_file.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'permission' in response.data['error'].lower()
    
    def test_uploader_can_access_own_file_without_org(self, api_client, owner_user):
        api_client.force_authenticate(user=owner_user)
        file_content = SimpleUploadedFile("personal.txt", b"personal", content_type="text/plain")
        personal_file = File.objects.create(
            filename='personal.txt',
            file_type='document',
            file=file_content,
            author=owner_user,
            owner=None,
            size=8
        )
        response = api_client.get(f'/api/file/{personal_file.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['filename'] == 'personal.txt'


@pytest.mark.django_db
class TestFileList:
    
    def test_requires_authentication(self, api_client):
        response = api_client.get('/api/file/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_member_sees_org_files(self, api_client, member_user, sample_file):
        api_client.force_authenticate(user=member_user)
        response = api_client.get('/api/file/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == str(sample_file.id)
    
    def test_outsider_does_not_see_org_files(self, api_client, outsider_user, sample_file):
        api_client.force_authenticate(user=outsider_user)
        response = api_client.get('/api/file/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0
    
    def test_filter_by_organization(self, api_client, owner_user, org_with_members):
        api_client.force_authenticate(user=owner_user)
        
        file1 = File.objects.create(
            filename='org_file.txt',
            file_type='log',
            file=SimpleUploadedFile("org.txt", b"org", content_type="text/plain"),
            author=owner_user,
            owner=org_with_members,
            size=3
        )
        other_org = Organization.objects.create(name='Other Org', slug='other')
        OrganizationUser.objects.create(user=owner_user, organization=other_org, user_type='OW')
        file2 = File.objects.create(
            filename='other_file.txt',
            file_type='log',
            file=SimpleUploadedFile("other.txt", b"other", content_type="text/plain"),
            author=owner_user,
            owner=other_org,
            size=5
        )
        
        response = api_client.get(f'/api/file/?org_id={org_with_members.id}')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == str(file1.id)
    
    def test_filter_by_file_type(self, api_client, owner_user, org_with_members):
        api_client.force_authenticate(user=owner_user)
        
        File.objects.create(
            filename='log.txt',
            file_type='log',
            file=SimpleUploadedFile("log.txt", b"log", content_type="text/plain"),
            author=owner_user,
            owner=org_with_members,
            size=3
        )
        File.objects.create(
            filename='doc.pdf',
            file_type='document',
            file=SimpleUploadedFile("doc.pdf", b"doc", content_type="application/pdf"),
            author=owner_user,
            owner=org_with_members,
            size=3
        )
        
        response = api_client.get('/api/file/?file_type=log')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['file_type'] == 'log'
