from rest_framework.viewsets import ModelViewSet
from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from drf_spectacular.utils import extend_schema, extend_schema_view

from DOSPORTAL.models import Measurement, MeasurementSegment, OrganizationUser
from ..serializers import MeasurementsSerializer
from ..serializers.measurements import MeasurementCreateSerializer, MeasurementSegmentSerializer


@extend_schema_view(
    list=extend_schema(description="List measurements accessible to the current user.", tags=["Measurements"]),
    retrieve=extend_schema(description="Get measurement detail by ID.", tags=["Measurements"]),
    create=extend_schema(
        description="Create a measurement. Supply owner_id to assign to an organization (user must be a member).",
        tags=["Measurements"],
    ),
)
class MeasurementViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return MeasurementCreateSerializer
        return MeasurementsSerializer

    def get_queryset(self):
        user = self.request.user
        user_orgs = OrganizationUser.objects.filter(
            user=user, user_type__in=["OW", "AD", "ME"]
        ).values_list("organization_id", flat=True)
        return (
            Measurement.objects.filter(owner__in=user_orgs)
            | Measurement.objects.filter(author=user)
        ).select_related("owner", "author", "flight").order_by("-time_created").distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            MeasurementsSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_create(self, serializer):
        owner = serializer.validated_data.get("owner")
        if owner:
            if not OrganizationUser.objects.filter(
                user=self.request.user,
                organization=owner,
                user_type__in=["OW", "AD", "ME"],
            ).exists():
                raise PermissionDenied(
                    "You do not have permission to create measurements for this organization."
                )
        serializer.save(author=self.request.user)


@extend_schema_view(
    create=extend_schema(
        description="Create a measurement segment. User must be a member of the measurement's organization.",
        tags=["Measurements"],
    ),
)
class MeasurementSegmentViewSet(CreateModelMixin, GenericViewSet):
    serializer_class = MeasurementSegmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MeasurementSegment.objects.all()

    def perform_create(self, serializer):
        measurement = serializer.validated_data["measurement"]
        if measurement.owner:
            if not OrganizationUser.objects.filter(
                user=self.request.user,
                organization=measurement.owner,
                user_type__in=["OW", "AD", "ME"],
            ).exists():
                raise PermissionDenied(
                    "You do not have permission to add segments to this measurement."
                )
        elif measurement.author != self.request.user:
            raise PermissionDenied("You do not have access to this measurement.")
        serializer.save()
