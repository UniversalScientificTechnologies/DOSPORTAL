"""Organization and User serializers."""

from rest_framework import serializers
from DOSPORTAL.models import (
    Organization,
    User,
    OrganizationUser,
    OrganizationInvite,
)


class OrganizationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug")


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name")


class OrganizationDetailSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = (
            "id",
            "name",
            "slug",
            "data_policy",
            "website",
            "contact_email",
            "description",
            "created_at",
            "members",
        )
        read_only_fields = ("id", "slug", "created_at")

    def get_members(self, obj):
        org_users = obj.user_organizations.select_related("user").all()
        return [
            {
                "id": org_user.user.id,
                "username": org_user.user.username,
                "first_name": org_user.user.first_name,
                "last_name": org_user.user.last_name,
                "user_type": org_user.user_type,
            }
            for org_user in org_users
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name")


class OrganizationUserSerializer(serializers.Serializer):
    id = serializers.CharField(source="organization.id")
    name = serializers.CharField(source="organization.name")
    user_type = serializers.CharField()
    data_policy = serializers.CharField(source="organization.get_data_policy_display")


class OrganizationInviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationInvite
        fields = [
            "id",
            "organization",
            "user_type",
            "created_by",
            "created_at",
            "expires_at",
            "used_at",
            "used_by",
            "revoked_at",
            "is_active",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "used_at",
            "used_by",
            "revoked_at",
            "is_active",
        ]
