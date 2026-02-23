import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from DOSPORTAL.models import Measurement, Organization, OrganizationUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user1(db):
    return User.objects.create_user(username="user1", password="testpass")


@pytest.fixture
def user2(db):
    return User.objects.create_user(username="user2", password="testpass")


@pytest.fixture
def org1(db):
    return Organization.objects.create(name="Organization 1")


@pytest.mark.django_db
def test_measurement_detail_unauthenticated(api_client, user1, org1):
    """Test that unauthenticated users get 401."""
    m1 = Measurement.objects.create(name="Measurement 1", author=user1, owner=org1)
    
    response = api_client.get(f"/api/measurement/{m1.id}/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_measurement_detail_not_found(api_client, user1):
    """Test that non-existent measurement returns 404."""
    api_client.force_authenticate(user=user1)
    
    response = api_client.get("/api/measurement/00000000-0000-0000-0000-000000000000/")
    assert response.status_code == 404
    assert 'not found' in response.data['error'].lower()


@pytest.mark.django_db
def test_measurement_detail_member_can_access(api_client, user1, user2, org1):
    """Test that organization members can access measurement."""
    # user1 is member of org1
    OrganizationUser.objects.create(user=user1, organization=org1, user_type="ME")
    
    # user2 creates measurement for org1
    m1 = Measurement.objects.create(name="Measurement 1", author=user2, owner=org1)
    
    # user1 should have access (as member)
    api_client.force_authenticate(user=user1)
    response = api_client.get(f"/api/measurement/{m1.id}/")
    assert response.status_code == 200
    assert response.data['name'] == "Measurement 1"
    assert response.data['id'] == str(m1.id)


@pytest.mark.django_db
def test_measurement_detail_author_can_access(api_client, user1, user2, org1):
    """Test that author can access measurement even if not member of organization."""
    # user1 is member of org1
    OrganizationUser.objects.create(user=user1, organization=org1, user_type="ME")
    
    # user2 creates measurement for org1 (but is NOT member)
    m1 = Measurement.objects.create(name="Measurement 1", author=user2, owner=org1)
    
    # user2 should have access (as author)
    api_client.force_authenticate(user=user2)
    response = api_client.get(f"/api/measurement/{m1.id}/")
    assert response.status_code == 200
    assert response.data['name'] == "Measurement 1"


@pytest.mark.django_db
def test_measurement_detail_outsider_cannot_access(api_client, user1, user2, org1):
    """Test that non-members cannot access measurement."""
    # user1 is member of org1
    OrganizationUser.objects.create(user=user1, organization=org1, user_type="ME")
    
    # user1 creates measurement for org1
    m1 = Measurement.objects.create(name="Measurement 1", author=user1, owner=org1)
    
    # user2 is NOT member and NOT author - should NOT have access
    api_client.force_authenticate(user=user2)
    response = api_client.get(f"/api/measurement/{m1.id}/")
    assert response.status_code == 403
    assert 'permission' in response.data['error'].lower()


@pytest.mark.django_db
def test_measurement_detail_all_member_types_can_access(api_client, org1):
    """Test that owner, admin, and member all have access."""
    owner_user = User.objects.create_user(username="owner", password="testpass")
    admin_user = User.objects.create_user(username="admin", password="testpass")
    member_user = User.objects.create_user(username="member", password="testpass")
    author_user = User.objects.create_user(username="author", password="testpass")
    
    OrganizationUser.objects.create(user=owner_user, organization=org1, user_type="OW")
    OrganizationUser.objects.create(user=admin_user, organization=org1, user_type="AD")
    OrganizationUser.objects.create(user=member_user, organization=org1, user_type="ME")
    
    m1 = Measurement.objects.create(name="Measurement 1", author=author_user, owner=org1)
    
    # All three org members should see the measurement
    for user in [owner_user, admin_user, member_user]:
        api_client.force_authenticate(user=user)
        response = api_client.get(f"/api/measurement/{m1.id}/")
        assert response.status_code == 200
        assert response.data['id'] == str(m1.id)


@pytest.mark.django_db
def test_measurement_detail_without_owner(api_client, user1, user2):
    """Test that measurement without owner is only accessible to author."""
    # Create measurement without owner
    m1 = Measurement.objects.create(name="Measurement 1", author=user1, owner=None)
    
    # user1 (author) should have access
    api_client.force_authenticate(user=user1)
    response = api_client.get(f"/api/measurement/{m1.id}/")
    assert response.status_code == 200
    assert response.data['id'] == str(m1.id)
    
    # user2 should NOT have access
    api_client.force_authenticate(user=user2)
    response = api_client.get(f"/api/measurement/{m1.id}/")
    assert response.status_code == 403
