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
def user3(db):
    return User.objects.create_user(username="user3", password="testpass")


@pytest.fixture
def org1(db):
    return Organization.objects.create(name="Organization 1")


@pytest.fixture
def org2(db):
    return Organization.objects.create(name="Organization 2")


@pytest.fixture
def org3(db):
    return Organization.objects.create(name="Organization 3")


@pytest.mark.django_db
def test_measurements_filtered_by_organization_membership(api_client, user1, user2, user3, org1, org2, org3):
    """Test that users only see measurements from their organizations."""
    
    # user1 is owner of org1 and member of org2
    OrganizationUser.objects.create(user=user1, organization=org1, user_type="OW")
    OrganizationUser.objects.create(user=user1, organization=org2, user_type="ME")
    
    # user2 is member of org3 only
    OrganizationUser.objects.create(user=user2, organization=org3, user_type="ME")
    
    # Create measurements for different organizations (user3 is author, not member of any org)
    m1 = Measurement.objects.create(name="Measurement 1", author=user3, owner=org1)
    m2 = Measurement.objects.create(name="Measurement 2", author=user3, owner=org2)
    m3 = Measurement.objects.create(name="Measurement 3", author=user3, owner=org3)
    
    # user1 should see m1 and m2 (from org1 and org2)
    api_client.force_authenticate(user=user1)
    response = api_client.get("/api/measurement/")
    assert response.status_code == 200
    data = response.json()
    measurement_ids = {m['id'] for m in data}
    assert str(m1.id) in measurement_ids
    assert str(m2.id) in measurement_ids
    assert str(m3.id) not in measurement_ids
    
    # user2 should see only m3 (from org3)
    api_client.force_authenticate(user=user2)
    response = api_client.get("/api/measurement/")
    assert response.status_code == 200
    data = response.json()
    measurement_ids = {m['id'] for m in data}
    assert str(m1.id) not in measurement_ids
    assert str(m2.id) not in measurement_ids
    assert str(m3.id) in measurement_ids



@pytest.mark.django_db
def test_measurements_user_sees_own_authored(api_client, user1, user2, org1):
    """Test that users see measurements they authored, regardless of owner."""
    
    # user1 is member of org1
    OrganizationUser.objects.create(user=user1, organization=org1, user_type="ME")
    
    # user2 is NOT member of org1, but authors a measurement
    m1 = Measurement.objects.create(name="Measurement 1", author=user2, owner=org1)
    m2 = Measurement.objects.create(name="Measurement 2", author=user1, owner=org1)
    
    # user2 should still see m1 because they are the author
    api_client.force_authenticate(user=user2)
    response = api_client.get("/api/measurement/")
    assert response.status_code == 200
    data = response.json()
    measurement_ids = {m['id'] for m in data}
    assert str(m1.id) in measurement_ids
    assert str(m2.id) not in measurement_ids
    
    # user1 should see both (member of org1)
    api_client.force_authenticate(user=user1)
    response = api_client.get("/api/measurement/")
    assert response.status_code == 200
    data = response.json()
    measurement_ids = {m['id'] for m in data}
    assert str(m1.id) in measurement_ids
    assert str(m2.id) in measurement_ids


@pytest.mark.django_db
def test_measurements_all_member_types_have_access(api_client, org1):
    owner_user = User.objects.create_user(username="owner", password="testpass")
    admin_user = User.objects.create_user(username="admin", password="testpass")
    member_user = User.objects.create_user(username="member", password="testpass")
    
    OrganizationUser.objects.create(user=owner_user, organization=org1, user_type="OW")
    OrganizationUser.objects.create(user=admin_user, organization=org1, user_type="AD")
    OrganizationUser.objects.create(user=member_user, organization=org1, user_type="ME")
    
    m1 = Measurement.objects.create(name="Measurement 1", author=owner_user, owner=org1)
    
    # All three should see the measurement
    for user in [owner_user, admin_user, member_user]:
        api_client.force_authenticate(user=user)
        response = api_client.get("/api/measurement/")
        assert response.status_code == 200
        data = response.json()
        measurement_ids = {m['id'] for m in data}
        assert str(m1.id) in measurement_ids


@pytest.mark.django_db
def test_measurements_no_organizations(api_client, user1):
    api_client.force_authenticate(user=user1)
    response = api_client.get("/api/measurement/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db
def test_measurements_unauthenticated(api_client):
    response = api_client.get("/api/measurement/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_measurements_without_owner(api_client, user1, user2):
    """Test measurements without owner org (null owner) are visible only to author."""
    
    # Create measurement without owner
    m1 = Measurement.objects.create(name="Measurement 1", author=user1, owner=None)
    
    # user1 (author) should see it
    api_client.force_authenticate(user=user1)
    response = api_client.get("/api/measurement/")
    assert response.status_code == 200
    data = response.json()
    measurement_ids = {m['id'] for m in data}
    assert str(m1.id) in measurement_ids
    
    # user2 should not see it
    api_client.force_authenticate(user=user2)
    response = api_client.get("/api/measurement/")
    assert response.status_code == 200
    data = response.json()
    measurement_ids = {m['id'] for m in data}
    assert str(m1.id) not in measurement_ids


@pytest.mark.django_db
def test_measurements_ordered_by_most_recent(api_client, user1, org1):
    OrganizationUser.objects.create(user=user1, organization=org1, user_type="ME")
    
    m1 = Measurement.objects.create(name="Measurement 1", author=user1, owner=org1)
    m2 = Measurement.objects.create(name="Measurement 2", author=user1, owner=org1)
    m3 = Measurement.objects.create(name="Measurement 3", author=user1, owner=org1)
    
    api_client.force_authenticate(user=user1)
    response = api_client.get("/api/measurement/")
    assert response.status_code == 200
    data = response.json()
    
    # Should be ordered newest first (m3, m2, m1)
    assert len(data) == 3
    assert data[0]['id'] == str(m3.id)
    assert data[1]['id'] == str(m2.id)
    assert data[2]['id'] == str(m1.id)
