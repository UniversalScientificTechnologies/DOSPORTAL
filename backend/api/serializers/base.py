"""Request/Response serializers for API documentation."""

from rest_framework import serializers


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="Username")
    password = serializers.CharField(
        help_text="Password", style={"input_type": "password"}
    )


class LoginResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    username = serializers.CharField()
    token = serializers.CharField()


class SignupRequestSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="Desired username")
    password = serializers.CharField(
        help_text="Password (min 8 characters)", style={"input_type": "password"}
    )
    password_confirm = serializers.CharField(
        help_text="Password confirmation", style={"input_type": "password"}
    )
    email = serializers.EmailField(required=False, help_text="Email address (optional)")


class AddOrganizationMemberRequestSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="Username of the user to add")
    user_type = serializers.ChoiceField(
        choices=[("ME", "Member"), ("AD", "Admin")],
        default="ME",
        help_text="Role for the new member",
    )


class CreateOrganizationRequestSerializer(serializers.Serializer):
    name = serializers.CharField(help_text="Organization name")
    data_policy = serializers.ChoiceField(
        choices=[("PR", "Private"), ("PU", "Public"), ("NV", "Non-public")],
        default="PU",
        help_text="Data access policy",
    )
    website = serializers.URLField(
        required=False, allow_blank=True, help_text="Organization website"
    )
    contact_email = serializers.EmailField(
        required=False, allow_blank=True, help_text="Contact email"
    )
    description = serializers.CharField(
        required=False, allow_blank=True, help_text="Organization description"
    )


class CreateInviteRequestSerializer(serializers.Serializer):
    user_type = serializers.ChoiceField(
        choices=[("ME", "Member"), ("AD", "Admin")],
        default="ME",
        help_text="Role for invited user",
    )
    expires_hours = serializers.IntegerField(
        default=24,
        min_value=1,
        max_value=168,
        help_text="Invite expiration time in hours (1-168)",
    )


class CreateInviteResponseSerializer(serializers.Serializer):
    invite_url = serializers.CharField()
    expires_at = serializers.DateTimeField()
    user_type = serializers.CharField()
