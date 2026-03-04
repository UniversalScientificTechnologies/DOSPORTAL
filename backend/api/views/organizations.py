from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from drf_spectacular.utils import extend_schema

from django.contrib.auth.models import User as DjangoUser

from DOSPORTAL.models import (
    OrganizationUser,
)
from ..serializers import (
    UserProfileSerializer,
    UserSummarySerializer,
    OrganizationUserSerializer,
    OrganizationSummarySerializer,
)


def get_user_organizations(user, user_types=None):
    """
    Get list of organization IDs where user is a member.
    
    Args:
        user: User instance
        user_types: user types to filter by (default: ["OW", "AD", "ME"])
    
    Returns:
        organization IDs
    """
    if user_types is None:
        user_types = ["OW", "AD", "ME"]
    
    return OrganizationUser.objects.filter(
        user=user,
        user_type__in=user_types
    ).values_list('organization_id', flat=True)


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
    responses={200: UserSummarySerializer},
    description="Get public user information by ID",
    tags=["Users"],
)
@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def UserDetail(request, user_id):
    try:
        user = DjangoUser.objects.get(id=user_id)
        serializer = UserSummarySerializer(user)
        return Response(serializer.data)
    except DjangoUser.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )


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
