import logging

from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from DOSPORTAL.models import File, OrganizationUser
from ..serializers import FileSerializer, FileUploadSerializer

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        description="List files accessible to the current user.",
        tags=["Files"],
        parameters=[
            OpenApiParameter("owner", OpenApiTypes.UUID, OpenApiParameter.QUERY, required=False, description="Filter by organization ID"),
            OpenApiParameter("file_type", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Filter by file type"),
        ],
    ),
    retrieve=extend_schema(description="Get file detail by ID.", tags=["Files"]),
    create=extend_schema(
        description="Upload a file. Supply owner (org UUID) to assign to an organization (user must be admin/owner).",
        tags=["Files"],
        request=FileUploadSerializer,
        responses={201: FileSerializer},
    ),
)
class FileViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return FileUploadSerializer
        return FileSerializer

    def get_queryset(self):
        user = self.request.user
        user_orgs = OrganizationUser.objects.filter(
            user=user, user_type__in=["OW", "AD", "ME"]
        ).values_list("organization_id", flat=True)
        qs = (
            File.objects.filter(owner__in=user_orgs) | File.objects.filter(author=user)
        ).order_by("-created_at").distinct()

        owner_id = self.request.query_params.get("owner")
        if owner_id:
            qs = qs.filter(owner_id=owner_id)
        file_type = self.request.query_params.get("file_type")
        if file_type:
            qs = qs.filter(file_type=file_type)
        return qs

    def create(self, request, *args, **kwargs):
        if "file" not in request.FILES:
            return Response(
                {"error": "No file was submitted"}, status=status.HTTP_400_BAD_REQUEST
            )
        owner_id = request.data.get("owner")
        if owner_id:
            if not OrganizationUser.objects.filter(
                user=request.user,
                organization_id=owner_id,
                user_type__in=["OW", "AD"],
            ).exists():
                raise PermissionDenied(
                    "You do not have permission to upload to this organization."
                )
        serializer = FileUploadSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            try:
                file_obj = serializer.save(author=request.user)
                return Response(FileSerializer(file_obj).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.exception(f"File upload failed: {str(e)}")
                return Response({"error": "Upload failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
