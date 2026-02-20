from django.db import models
from django.conf import settings
from django.urls import reverse
import secrets
from django.utils.text import slugify
from .utils import UUIDMixin
import hashlib
from django.utils import timezone


class Organization(UUIDMixin):
    DATA_POLICY_CHOICES = [
        ("PR", "Private"),
        ("PU", "Public"),
        ("NV", "Non-public"),
    ]

    name = models.CharField(max_length=200)
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="organizations",
        through="OrganizationUser",
    )
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    data_policy = models.CharField(
        max_length=2, choices=DATA_POLICY_CHOICES, default="PU"
    )
    can_users_change_policy = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    website = models.URLField(max_length=200, null=True, blank=True)
    contact_email = models.EmailField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Aktualizace slug pole na základě názvu, pokud není zadáno
        if not self.slug:
            self.slug = slugify(self.name)
        super(Organization, self).save(*args, **kwargs)

    def __str__(self):
        return self.name

    def get_members(self):
        return ", ".join([str(user) for user in self.users.all()])

    def get_admin_url(self):
        return reverse(
            "admin:%s_%s_change" % (self._meta.app_label, self._meta.model_name),
            args=(self.id,),
        )

    def get_absolute_url(self):
        return reverse("organization-detail", args=[str(self.id)])

class OrganizationUser(models.Model):

    USER_TYPE_CHOICES = [
        ("ME", "Member"),
        ("AD", "Admin"),
        ("OW", "Owner"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization_users",
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="user_organizations"
    )
    user_type = models.CharField(max_length=2, choices=USER_TYPE_CHOICES, default="ME")

    class Meta:
        unique_together = ("user", "organization")

    def __str__(self):
        return f"{self.user.username}: {self.get_user_type_display()} of {self.organization.name}"
    

class OrganizationInvite(models.Model):
    """
    One-time invite link for joining an organization.
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="invites"
    )
    token_hash = models.CharField(
        max_length=64, unique=True, help_text="SHA256 hex digest of the invite token"
    )
    user_type = models.CharField(
        max_length=2, choices=[("ME", "Member"), ("AD", "Admin")], default="ME"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_invites",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="used_invites",
    )
    revoked_at = models.DateTimeField(null=True, blank=True)

    @property
    def is_active(self):
        now = timezone.now()
        return (
            self.used_at is None and self.revoked_at is None and now < self.expires_at
        )

    @staticmethod
    def generate_token():
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def __str__(self):
        return f"Invite for {self.organization.name} (active: {self.is_active})"
