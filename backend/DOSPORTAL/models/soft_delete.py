from django.db import models
from django.conf import settings
from django.utils.timezone import now


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return self.update(is_deleted=True, deleted_at=now())

    def hard_delete(self):
        return super().delete()

    def active(self):
        return self.filter(is_deleted=False)

    def deleted_only(self):
        return self.filter(is_deleted=True)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

    def deleted_only(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=True)

    def all_with_deleted(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    objects = SoftDeleteManager()
    objects_default = models.Manager()

    class Meta:
        abstract = True

    def soft_delete(self, deleted_by=None):
        if not self.is_deleted:
            self.is_deleted = True
            self.deleted_at = now()
            self.deleted_by = deleted_by
            self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

    def restore(self):
        if self.is_deleted:
            self.is_deleted = False
            self.deleted_at = None
            self.deleted_by = None
            self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

    def hard_delete(self):
        super().delete()
