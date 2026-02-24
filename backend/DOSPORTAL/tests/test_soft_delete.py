import pytest
from django.contrib.auth.models import User
from DOSPORTAL.models import Organization, Measurement, File


@pytest.fixture
def user(db):
    return User.objects.create_user(username="testuser", password="testpass")


@pytest.fixture
def org(db):
    return Organization.objects.create(name="Test Org")


@pytest.fixture
def measurement(db, user, org):
    return Measurement.objects.create(name="Test Measurement", author=user, owner=org)


@pytest.mark.django_db
def test_soft_delete_sets_flags(measurement, user):
    """soft_delete() sets is_deleted=True, deleted_at and deleted_by."""
    measurement.soft_delete(deleted_by=user)

    # Use objects_default to bypass the active-only manager
    m = Measurement.objects_default.get(pk=measurement.pk)
    assert m.is_deleted is True
    assert m.deleted_at is not None
    assert m.deleted_by == user


@pytest.mark.django_db
def test_soft_deleted_object_hidden_from_default_manager(measurement, user):
    """Soft-deleted objects must NOT appear in Model.objects (default manager)."""
    assert Measurement.objects.filter(pk=measurement.pk).exists()

    measurement.soft_delete(deleted_by=user)

    assert not Measurement.objects.filter(pk=measurement.pk).exists()


@pytest.mark.django_db
def test_objects_default_returns_deleted(measurement, user):
    """objects_default must still return soft-deleted records."""
    measurement.soft_delete(deleted_by=user)

    assert Measurement.objects_default.filter(pk=measurement.pk).exists()


@pytest.mark.django_db
def test_restore_clears_flags(measurement, user):
    """restore() resets is_deleted, deleted_at and deleted_by."""
    measurement.soft_delete(deleted_by=user)
    measurement.restore()

    m = Measurement.objects.get(pk=measurement.pk)
    assert m.is_deleted is False
    assert m.deleted_at is None
    assert m.deleted_by is None


@pytest.mark.django_db
def test_queryset_bulk_delete_soft_deletes(user, org):
    """QuerySet.delete() on SoftDeleteModel performs soft delete, not hard delete."""
    m1 = Measurement.objects.create(name="M1", author=user, owner=org)
    m2 = Measurement.objects.create(name="M2", author=user, owner=org)

    Measurement.objects.filter(owner=org).delete()

    # Both rows still exist in DB
    assert Measurement.objects_default.filter(pk=m1.pk).exists()
    assert Measurement.objects_default.filter(pk=m2.pk).exists()
    # But are hidden from the default manager
    assert not Measurement.objects.filter(owner=org).exists()
