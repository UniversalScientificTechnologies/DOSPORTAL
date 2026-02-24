from django.utils.dateparse import parse_datetime
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError

from DOSPORTAL.models import (
    DetectorManufacturer,
    DetectorType,
    Detector,
    DetectorLogbook,
    OrganizationUser,
)
from ..serializers import (
    DetectorManufacturerSerializer,
    DetectorTypeSerializer,
    DetectorSerializer,
    DetectorLogbookSerializer,
)
from ..viewsets_base import SoftDeleteModelViewSet


@extend_schema_view(
    list=extend_schema(description="List all detector manufacturers.", tags=["Detectors"]),
    create=extend_schema(description="Create a detector manufacturer.", tags=["Detectors"]),
    retrieve=extend_schema(description="Get detector manufacturer by ID.", tags=["Detectors"]),
    update=extend_schema(description="Update a detector manufacturer.", tags=["Detectors"]),
    partial_update=extend_schema(description="Partially update a detector manufacturer.", tags=["Detectors"]),
    destroy=extend_schema(description="Delete a detector manufacturer.", tags=["Detectors"]),
)
class DetectorManufacturerViewSet(ModelViewSet):
    queryset = DetectorManufacturer.objects.all().order_by("name")
    serializer_class = DetectorManufacturerSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated()]


@extend_schema_view(
    list=extend_schema(description="List all detector types.", tags=["Detectors"]),
    create=extend_schema(description="Create a detector type.", tags=["Detectors"]),
    retrieve=extend_schema(description="Get detector type by ID.", tags=["Detectors"]),
    update=extend_schema(description="Update a detector type.", tags=["Detectors"]),
    partial_update=extend_schema(description="Partially update a detector type.", tags=["Detectors"]),
    destroy=extend_schema(description="Delete a detector type.", tags=["Detectors"]),
)
class DetectorTypeViewSet(ModelViewSet):
    queryset = DetectorType.objects.select_related("manufacturer").order_by("name")
    serializer_class = DetectorTypeSerializer
    permission_classes = [IsAuthenticated]


@extend_schema_view(
    list=extend_schema(
        description="List detectors accessible to the current user (filtered by org membership).",
        tags=["Detectors"],
        parameters=[
            OpenApiParameter(
                name="owner",
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description="Filter by organization ID",
                required=False,
            ),
        ],
    ),
    create=extend_schema(description="Create a detector. The owner org must be one where the user is admin/owner.", tags=["Detectors"]),
    retrieve=extend_schema(description="Get detector detail by ID.", tags=["Detectors"]),
    update=extend_schema(description="Update a detector (org admin/owner only).", tags=["Detectors"]),
    partial_update=extend_schema(description="Partially update a detector (org admin/owner only).", tags=["Detectors"]),
    destroy=extend_schema(description="Soft-delete a detector (org admin/owner only).", tags=["Detectors"]),
)
class DetectorViewSet(SoftDeleteModelViewSet):

    serializer_class = DetectorSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        user_orgs = OrganizationUser.objects.filter(
            user=user, user_type__in=["OW", "AD", "ME"]
        ).values_list("organization_id", flat=True)
        qs = Detector.objects.filter(owner__in=user_orgs).select_related(
            "type__manufacturer", "owner"
        ).order_by("-created")
        owner_id = self.request.query_params.get("owner")
        if owner_id:
            qs = qs.filter(owner_id=owner_id)
        return qs

    def perform_create(self, serializer):
        owner = serializer.validated_data.get("owner")
        if not OrganizationUser.objects.filter(
            user=self.request.user,
            organization=owner,
            user_type__in=["OW", "AD"],
        ).exists():
            raise PermissionDenied()
        serializer.save()

    def _user_is_org_admin(self, detector):
        if not detector.owner:
            return False
        return OrganizationUser.objects.filter(
            user=self.request.user,
            organization=detector.owner,
            user_type__in=["OW", "AD"],
        ).exists()

    def perform_update(self, serializer):
        if not self._user_is_org_admin(serializer.instance):
            raise PermissionDenied()
        serializer.save()

    def perform_destroy(self, instance):
        if not self._user_is_org_admin(instance):
            raise PermissionDenied()
        instance.soft_delete(deleted_by=self.request.user)


@extend_schema_view(
    list=extend_schema(
        description="List detector logbook entries with optional filters.",
        tags=["Detectors"],
        parameters=[
            OpenApiParameter("detector", OpenApiTypes.UUID, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("entry_type", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("date_from", OpenApiTypes.DATETIME, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("date_to", OpenApiTypes.DATETIME, OpenApiParameter.QUERY, required=False),
        ],
    ),
    create=extend_schema(description="Create a logbook entry.", tags=["Detectors"]),
    retrieve=extend_schema(description="Get a logbook entry by ID.", tags=["Detectors"]),
    update=extend_schema(description="Update a logbook entry.", tags=["Detectors"]),
    partial_update=extend_schema(description="Partially update a logbook entry.", tags=["Detectors"]),
    destroy=extend_schema(description="Soft-delete a logbook entry.", tags=["Detectors"]),
)
class DetectorLogbookViewSet(SoftDeleteModelViewSet):
    serializer_class = DetectorLogbookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = DetectorLogbook.objects.select_related("detector", "author").all()
        detector_id = self.request.query_params.get("detector")
        if detector_id:
            qs = qs.filter(detector_id=detector_id)
        entry_type = self.request.query_params.get("entry_type")
        if entry_type:
            qs = qs.filter(entry_type=entry_type)
        date_from = self.request.query_params.get("date_from")
        if date_from:
            parsed = parse_datetime(date_from)
            if parsed:
                qs = qs.filter(created__gte=parsed)
        date_to = self.request.query_params.get("date_to")
        if date_to:
            parsed = parse_datetime(date_to)
            if parsed:
                qs = qs.filter(created__lte=parsed)
        return qs

    def _has_detector_access(self, detector):
        return (
            detector.owner and self.request.user in detector.owner.users.all()
        ) or detector.access.filter(users=self.request.user).exists()

    def perform_create(self, serializer):
        detector_id = self.request.data.get("detector")
        if detector_id:
            try:
                detector = Detector.objects.get(id=detector_id)
            except Detector.DoesNotExist:
                raise NotFound("Detector not found.")
            if not self._has_detector_access(detector):
                raise PermissionDenied("Access to the detector denied.")
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        if not self._has_detector_access(serializer.instance.detector):
            raise PermissionDenied("Access to the detector denied.")
        serializer.save(modified_by=self.request.user)

    def perform_destroy(self, instance):
        if not self._has_detector_access(instance.detector):
            raise PermissionDenied("Access to the detector denied.")
        instance.soft_delete(deleted_by=self.request.user)
