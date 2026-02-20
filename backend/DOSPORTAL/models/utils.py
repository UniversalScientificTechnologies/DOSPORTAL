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

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.ImageField(
        default="default_user_profileimage.jpg", upload_to="profile_pics"
    )
    web = models.URLField(max_length=200, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"  # show how we want it to be displayed
