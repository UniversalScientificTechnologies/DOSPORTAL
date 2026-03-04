from django.db import models
from django.contrib.auth.models import User
import uuid
from django.urls import reverse

class UUIDMixin(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, unique=True
    )

    def get_admin_url(self):
        return reverse(
            "admin:%s_%s_change" % (self._meta.app_label, self._meta.model_name),
            args=(self.id,),
        )

    class Meta:
        abstract = True


class ProcessingStatusMixin(models.Model):
    """Mixin that adds async processing status tracking to a model."""

    PROCESSING_PENDING = "pending"
    PROCESSING_IN_PROGRESS = "processing"
    PROCESSING_COMPLETED = "completed"
    PROCESSING_FAILED = "failed"

    PROCESSING_STATUS_CHOICES = (
        (PROCESSING_PENDING, "Pending processing"),
        (PROCESSING_IN_PROGRESS, "Processing in progress"),
        (PROCESSING_COMPLETED, "Processing completed"),
        (PROCESSING_FAILED, "Processing failed"),
    )

    processing_status = models.CharField(
        max_length=16,
        choices=PROCESSING_STATUS_CHOICES,
        default=PROCESSING_PENDING,
        help_text="Status of async background processing",
    )

    class Meta:
        abstract = True


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.ImageField(
        default="default_user_profileimage.jpg", upload_to="profile_pics"
    )
    web = models.URLField(max_length=200, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"  # show how we want it to be displayed
