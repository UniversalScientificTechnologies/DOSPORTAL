from django.db import transaction
from django.utils import timezone

from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from django.contrib.auth.models import User as DjangoUser

from DOSPORTAL.models import (
    Organization,
    OrganizationUser,
    OrganizationInvite,
)
from ..serializers import (
    UserProfileSerializer,
    OrganizationUserSerializer,
    OrganizationDetailSerializer,
    OrganizationSummarySerializer,
    AddOrganizationMemberRequestSerializer,
    CreateOrganizationRequestSerializer,
    CreateInviteRequestSerializer,
    CreateInviteResponseSerializer,
)
from ..permissions import check_org_admin_permission

import logging

logger = logging.getLogger(__name__)


@extend_schema(
    request=CreateOrganizationRequestSerializer,
    responses={201: OrganizationDetailSerializer},
    description="Create a new organization (creator becomes owner)",
    tags=["Organizations"],
)
@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def Organizations(request):
    if request.method == "POST":
        name = request.data.get("name")
        data_policy = request.data.get("data_policy", "PU")
        website = request.data.get("website", "")
        contact_email = request.data.get("contact_email", "")
        description = request.data.get("description", "")

        if not name:
            return Response(
                {"detail": "Organization name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            org = Organization.objects.create(
                name=name,
                data_policy=data_policy,
                website=website,
                contact_email=contact_email,
                description=description,
            )
            OrganizationUser.objects.create(
                user=request.user, organization=org, user_type="OW"
            )
            serializer = OrganizationDetailSerializer(org)
            logger.info("Organization created: %s by user %s", org.id, request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception:
            return Response(
                {"detail": "An error occurred while creating the organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )


@extend_schema(
    responses={200: OrganizationDetailSerializer},
    request=OrganizationDetailSerializer,
    description="Get or update organization details",
    tags=["Organizations"],
    parameters=[
        OpenApiParameter(
            name="org_id",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="Organization ID",
        )
    ],
)
@api_view(["GET", "PUT"])
@permission_classes((IsAuthenticated,))
def OrganizationDetail(request, org_id):
    try:
        org = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response(
            {"detail": "Organization not found."}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = OrganizationDetailSerializer(org)
        return Response(serializer.data)

    elif request.method == "PUT":
        # Check if user is owner or admin
        has_permission, _ = check_org_admin_permission(request.user, org)
        if not has_permission:
            return Response(
                {"detail": "You do not have permission to edit this organization."},
                status=status.HTTP_403_FORBIDDEN,
            )

        allowed_fields = [
            "name",
            "data_policy",
            "website",
            "contact_email",
            "description",
        ]
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = OrganizationDetailSerializer(org, data=update_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    request=AddOrganizationMemberRequestSerializer,
    responses={
        201: {"description": "User added successfully"},
        200: {"description": "User role updated or user removed"},
        400: {"description": "Bad request (invalid data, duplicate member, etc.)"},
        403: {"description": "Permission denied"},
        404: {"description": "Organization or user not found"},
    },
    description="Manage organization members (add, update role, remove)",
    tags=["Organizations"],
    parameters=[
        OpenApiParameter(
            name="org_id",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="Organization ID",
        )
    ],
)
@api_view(["POST", "PUT", "DELETE"])
@permission_classes((IsAuthenticated,))
def OrganizationMember(request, org_id):
    """
    Permissions: Only owner/admin can do this.
    POST: Add a user to an organization by username.
    PUT: Change a user's role to an organization by username.
    DELETE: Remove a user from an organization by username.
    """
    username = request.data.get("username")
    user_type = request.data.get("user_type", "ME")
    if not username:
        return Response({"detail": "Username required."}, status=400)
    try:
        org = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response({"detail": "Organization not found."}, status=404)

    if request.method == "POST":
        has_permission, _ = check_org_admin_permission(request.user, org)
        if not has_permission:
            return Response(
                {"detail": "You do not have permission to add members."}, status=403
            )
        # Only allow adding Member or Admin roles
        if user_type not in ["ME", "AD"]:
            return Response(
                {"detail": "Invalid user_type. Only ME or AD allowed."}, status=400
            )
        try:
            user = DjangoUser.objects.get(username=username)
        except DjangoUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        if OrganizationUser.objects.filter(user=user, organization=org).exists():
            return Response({"detail": "User already a member."}, status=400)
        OrganizationUser.objects.create(
            user=user, organization=org, user_type=user_type
        )
        return Response({"detail": "User added."}, status=201)
    elif request.method == "PUT":
        # Only allow owner/admin to change role
        has_permission, _ = check_org_admin_permission(request.user, org)
        if not has_permission:
            return Response(
                {"detail": "You do not have permission to change roles."}, status=403
            )
        try:
            user = DjangoUser.objects.get(username=username)
        except DjangoUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        org_member = OrganizationUser.objects.filter(
            user=user, organization=org
        ).first()
        if not org_member:
            return Response(
                {"detail": "User is not a member of this organization."}, status=404
            )
        if user_type not in ["ME", "AD"]:
            return Response({"detail": "Invalid role."}, status=400)
        org_member.user_type = user_type
        org_member.save()
        return Response({"detail": f"Role updated to {user_type}."}, status=200)
    elif request.method == "DELETE":
        try:
            user = DjangoUser.objects.get(username=username)
        except DjangoUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        # Only allow owner/admin to remove member OR self to remove self
        if user != request.user:  # can remove self
            has_permission, _ = check_org_admin_permission(request.user, org)
            if not has_permission:
                return Response(
                    {"detail": "You do not have permission to remove this member."},
                    status=403,
                )

        org_member = OrganizationUser.objects.filter(
            user=user, organization=org
        ).first()
        if not org_member:
            return Response(
                {"detail": "User is not a member of this organization."}, status=404
            )
        if org_member.user_type == "OW":
            return Response(
                {"detail": "You cannot remove the owner from the organization."},
                status=403,
            )
        org_member.delete()
        return Response({"detail": "User removed from organization."}, status=200)


@extend_schema(
    responses={200: UserProfileSerializer},
    request=UserProfileSerializer,
    description="Get or update current user profile information",
    tags=["Authentication"],
)
@api_view(["GET", "PUT"])
@permission_classes((IsAuthenticated,))
def UserProfile(request):
    if request.method == "GET":
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            # Only allow updating specific fields
            allowed_fields = ["email", "first_name", "last_name"]
            for field in allowed_fields:
                if field in request.data:
                    setattr(request.user, field, request.data[field])
            request.user.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    responses={200: OrganizationUserSerializer(many=True)},
    description="Get all organizations that the current user is a member of",
    tags=["Authentication"],
)
@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def UserOrganizations(request):
    """Get all organizations that the current user is a member of."""
    org_users = OrganizationUser.objects.filter(user=request.user).select_related(
        "organization"
    )
    serializer = OrganizationUserSerializer(org_users, many=True)
    return Response(serializer.data)


@extend_schema(
    responses={200: OrganizationSummarySerializer(many=True)},
    description="Get all organizations where the current user is Admin or Owner",
    tags=["Authentication"],
)
@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def UserOrganizationsOwned(request):
    """Get all organizations where user is Admin/Owner."""
    org_users = OrganizationUser.objects.filter(
        user=request.user, user_type__in=["OW", "AD"]
    ).select_related("organization")
    organizations = [ou.organization for ou in org_users]
    serializer = OrganizationSummarySerializer(organizations, many=True)
    return Response(serializer.data)


@extend_schema(
    request=CreateInviteRequestSerializer,
    responses={201: CreateInviteResponseSerializer},
    description="Create a one-time invite link for an organization (owner/admin only)",
    tags=["Organizations"],
    parameters=[
        OpenApiParameter(
            name="org_id",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="Organization ID",
        )
    ],
)
@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def CreateOrganizationInvite(request, org_id):
    """Create a one-time invite link for an organization (owner/admin only)."""
    user_type = request.data.get("user_type", "ME")
    expires_hours = int(request.data.get("expires_hours", 24))
    expires_hours = min(max(expires_hours, 1), 168)  # Clamp time to 1-168 hours
    try:
        org = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response({"detail": "Organization not found."}, status=404)
    has_permission, _ = check_org_admin_permission(request.user, org)
    if not has_permission:
        return Response(
            {"detail": "You do not have permission to create invites."}, status=403
        )
    if user_type not in ["ME", "AD"]:
        return Response({"detail": "Invalid user_type."}, status=400)

    # Generate token and hash
    token = OrganizationInvite.generate_token()
    token_hash = OrganizationInvite.hash_token(token)
    expires_at = timezone.now() + timezone.timedelta(hours=expires_hours)
    invite = OrganizationInvite.objects.create(
        organization=org,
        token_hash=token_hash,
        user_type=user_type,
        created_by=request.user,
        expires_at=expires_at,
    )
    invite_url = f"/invite/{token}/"
    return Response(
        {
            "invite_url": invite_url,
            "expires_at": invite.expires_at,
            "user_type": invite.user_type,
        },
        status=201,
    )


@extend_schema(
    description="Accept an organization invite using a one-time token",
    tags=["Organizations"],
    parameters=[
        OpenApiParameter(
            name="token",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description="One-time invite token",
        )
    ],
)
@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def AcceptOrganizationInvite(request, token):
    """Accept an invite link (one-time)."""
    token_hash = OrganizationInvite.hash_token(token)
    try:
        with transaction.atomic():
            invite = OrganizationInvite.objects.select_for_update().get(
                token_hash=token_hash
            )
            if not invite.is_active:
                return Response(
                    {"detail": "Invite is not active (expired, used, or revoked)."},
                    status=400,
                )
            if OrganizationUser.objects.filter(
                user=request.user, organization=invite.organization
            ).exists():
                return Response(
                    {"detail": "You are already a member of this organization."},
                    status=400,
                )
            OrganizationUser.objects.create(
                user=request.user,
                organization=invite.organization,
                user_type=invite.user_type,
            )
            invite.used_at = timezone.now()
            invite.used_by = request.user
            invite.save()
            return Response(
                {
                    "detail": "Joined.",
                    "organization_id": str(invite.organization.id),
                    "user_type": invite.user_type,
                },
                status=200,
            )
    except OrganizationInvite.DoesNotExist:
        return Response({"detail": "Invalid invite token."}, status=404)


@extend_schema(
    description="Get details about an organization invite for preview before joining",
    tags=["Organizations"],
    parameters=[
        OpenApiParameter(
            name="token",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description="One-time invite token",
        )
    ],
)
@api_view(["GET"])
@permission_classes((AllowAny,))
def GetOrganizationInviteDetails(request, token):
    """Get details about an invite and its organization for preview before joining."""
    token_hash = OrganizationInvite.hash_token(token)
    try:
        invite = OrganizationInvite.objects.select_related("organization").get(
            token_hash=token_hash
        )
        org = invite.organization
        org_data = OrganizationDetailSerializer(org).data
        return Response(
            {
                "organization": org_data,
                "user_type": invite.user_type,
                "expires_at": invite.expires_at,
                "is_active": invite.is_active,
            },
            status=200,
        )
    except OrganizationInvite.DoesNotExist:
        return Response({"detail": "Invalid invite token."}, status=404)
