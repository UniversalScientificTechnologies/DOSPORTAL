"""File management endpoints."""

from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from DOSPORTAL.models import File, OrganizationUser, Organization
from ..serializers import FileSerializer, FileUploadSerializer
from ..permissions import IsOrganizationMember, IsOrganizationAdmin

import logging

logger = logging.getLogger(__name__)

def _user_can_access_file(user, file_obj):
    """Check if user can access a file (author or org member)."""
    if not file_obj.owner:
        return user == file_obj.author
    return IsOrganizationMember.user_is_member(user, file_obj.owner)


@extend_schema(
    responses={200: FileSerializer(many=True)},
    description="Get list of files (filtered by user's organizations)",
    tags=["Files"],
    parameters=[
        OpenApiParameter(
            name="org_id",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.QUERY,
            description="Filter by organization ID",
            required=False,
        ),
        OpenApiParameter(
            name="file_type",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by file type (log, trajectory, document, etc.)",
            required=False,
        ),
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def FileList(request):
    """
    Get list of files that the user has access to.
    User can only see files from organizations where they are owner or admin.
    """
    # Get organizations where user is member
    user_orgs = OrganizationUser.objects.filter(
        user=request.user,
        user_type__in=["OW", "AD", "ME"]
    ).values_list('organization_id', flat=True)
    
    # Base queryset: files from user's organizations or uploaded by user
    queryset = File.objects.filter(
        owner__in=user_orgs
    ) | File.objects.filter(author=request.user)
    
    # Apply filters
    org_id = request.GET.get('org_id')
    if org_id:
        queryset = queryset.filter(owner_id=org_id)
    
    file_type = request.GET.get('file_type')
    if file_type:
        queryset = queryset.filter(file_type=file_type)
    
    # Order by most recent first
    queryset = queryset.order_by('-created_at').distinct()
    
    serializer = FileSerializer(queryset, many=True)
    return Response(serializer.data)


@extend_schema(
    responses={200: FileSerializer},
    description="Get file details by ID",
    tags=["Files"],
    parameters=[
        OpenApiParameter(
            name="file_id",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="File ID",
        )
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def FileDetail(request, file_id):
    """
    Get detailed information about a specific file.
    User must be owner or admin of the file's organization.
    """
    try:
        file_obj = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return Response(
            {'error': 'File not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permission
    if not _user_can_access_file(request.user, file_obj):
        return Response(
            {'error': 'You do not have permission to access this file'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = FileSerializer(file_obj)
    return Response(serializer.data)


@extend_schema(
    request=FileUploadSerializer,
    responses={201: FileSerializer},
    description="Upload a new file to an organization (admin/owner only)",
    tags=["Files"],
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
@permission_classes([IsAuthenticated, IsOrganizationAdmin])
def FileUpload(request, org_id):
    """
    Upload a file and create File record.
    User must be owner or admin of the target organization.
    """
    try:
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file was submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        org = Organization.objects.get(id=org_id)  # guaranteed by permission check

        data = {
            'filename': request.data.get('filename'),
            'file_type': request.data.get('file_type', 'log'),
            'metadata': request.data.get('metadata', {}),
            'file': request.FILES['file'],
            'owner': str(org_id),
        }

        serializer = FileUploadSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            file_obj = serializer.save(author=request.user, owner=org)
            return Response({
                'id': str(file_obj.id),
                'filename': file_obj.filename,
                'file_type': file_obj.file_type,
                'size': file_obj.size,
                'created_at': file_obj.created_at.isoformat(),
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.exception(f"File upload failed: {str(e)}")
        return Response(
            {'error': 'Upload failed.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
