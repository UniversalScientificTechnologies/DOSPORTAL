from rest_framework import serializers
from DOSPORTAL.models import (
    measurement,
    Record,
    Detector,
    DetectorLogbook,
    DetectorType,
    DetectorManufacturer,
    Organization,
    User,
    OrganizationUser,
    OrganizationInvite
)


class DetectorManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetectorManufacturer
        fields = ("id", "name", "url")


class DetectorTypeSerializer(serializers.ModelSerializer):
    manufacturer = DetectorManufacturerSerializer(read_only=True)

    class Meta:
        model = DetectorType
        fields = ("id", "name", "manufacturer", "url", "description")


class OrganizationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug")


class OrganizationDetailSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "data_policy", "website", "contact_email", "description", "created_at", "members")
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


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name")


class DetectorSerializer(serializers.ModelSerializer):
    type = DetectorTypeSerializer(read_only=True)
    owner = OrganizationSummarySerializer(read_only=True)

    class Meta:
        model = Detector
        fields = "__all__"


class RecordSerializer(serializers.ModelSerializer):
    # detector = DetectorSerializer(read_only = True, many=True)
    class Meta:
        model = Record
        # fields = ['id', 'name', 'description', ]
        fields = "__all__"


class DetectorLogbookSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    modified_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = DetectorLogbook
        fields = "__all__"
        read_only_fields = ["id", "author", "created", "modified", "modified_by"]


class MeasurementsSerializer(serializers.ModelSerializer):

    records = RecordSerializer(read_only=True, many=True)

    class Meta:
        model = measurement
        fields = "__all__"
        # fields = ('id', 'name')
        # exclude = ()


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
        read_only_fields = ["id", "created_by", "created_at", "used_at", "used_by", "revoked_at", "is_active"]