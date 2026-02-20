"""File management endpoints."""

from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from DOSPORTAL.models import File, OrganizationUser
from ..serializers import FileSerializer, FileUploadSerializer
from .organizations import check_org_member_permission

import logging

logger = logging.getLogger(__name__)

def check_org_member_permission_file(user, file_obj):
    """
    Check if user has permission of member (or higher).
    Returns (has_permission: bool, org_user: OrganizationUser|None)
    """
    if not file_obj.owner:
        # Files without organization can be accessed by uploader only
        return user == file_obj.author, None
    else:
        return check_org_member_permission(user, file_obj.owner)


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
    has_permission, _ = check_org_member_permission_file(request.user, file_obj)
    if not has_permission:
        return Response(
            {'error': 'You do not have permission to access this file'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = FileSerializer(file_obj)
    return Response(serializer.data)


@extend_schema(
    request=FileUploadSerializer,
    responses={201: FileSerializer},
    description="Upload a new file",
    tags=["Files"],
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def FileUpload(request):
    """
    Upload a file and create File record.
    User must be owner or admin of the target organization.
    """
    try:
        # Validate file presence
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file was submitted'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check organization permission if owner is specified
        owner_id = request.data.get('owner')
        if owner_id:
            org_user = OrganizationUser.objects.filter(
                user=request.user,
                organization_id=owner_id,
                user_type__in=["OW", "AD"]
            ).first()
            
            if not org_user:
                return Response(
                    {'error': 'You do not have permission to upload files to this organization'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        data = {
            'filename': request.data.get('filename'),
            'file_type': request.data.get('file_type', 'log'),
            'metadata': request.data.get('metadata', {}),
            'file': request.FILES['file'],  # Add file directly for validation
        }
        
        # Add owner if provided
        if owner_id:
            data['owner'] = owner_id
        
        serializer = FileUploadSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            file_obj = serializer.save(author=request.user)
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
