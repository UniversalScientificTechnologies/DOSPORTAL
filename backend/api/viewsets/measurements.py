from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from drf_spectacular.utils import extend_schema, extend_schema_view

from django.db import transaction
from DOSPORTAL.models import Measurement, MeasurementSegment, OrganizationUser, MeasurementArtifact
from ..serializers import MeasurementsSerializer
from ..serializers.measurements import MeasurementCreateSerializer, MeasurementSegmentSerializer
from ..viewsets_base import SoftDeleteModelViewSet
import pandas as pd
import numpy as np
from django_q.tasks import async_task


def _load_spectral_parquet(measurement):
    """Load Parquet DataFrame from a completed Measurement's artifact.
    Returns (df, error_response). If error_response is not None, return it directly.
    """
    if measurement.processing_status == Measurement.PROCESSING_PENDING:
        return None, Response(
            {"detail": "Measurement artifact not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    
    if measurement.processing_status == Measurement.PROCESSING_IN_PROGRESS:
        return None, Response(
            {"detail": "Measurement artifact is still being processed."},
            status=status.HTTP_425_TOO_EARLY,
        )

    if measurement.processing_status != Measurement.PROCESSING_COMPLETED:
        return None, Response(
            {"detail": f"Artifact not ready. Status: {measurement.processing_status}"},
            status=status.HTTP_425_TOO_EARLY,
        )

    try:
        artifact = MeasurementArtifact.objects.get(
            measurement=measurement,
        )
    except MeasurementArtifact.DoesNotExist:
        return None, Response(
            {"detail": "Parquet artifact not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    artifact.artifact.file.open("rb")
    df = pd.read_parquet(artifact.artifact.file, engine="fastparquet")
    artifact.artifact.file.close()

    channel_cols = [col for col in df.columns if col.startswith("channel_")]
    df[channel_cols] = df[channel_cols].fillna(0)
    return df, None


@extend_schema_view(
    list=extend_schema(description="List measurements accessible to the current user.", tags=["Measurements"]),
    retrieve=extend_schema(description="Get measurement detail by ID.", tags=["Measurements"]),
    create=extend_schema(
        description="Create a measurement. Supply owner_id to assign to an organization (user must be a member).",
        tags=["Measurements"],
    ),
    destroy=extend_schema(description="Soft-delete a measurement (author or org admin/owner only).", tags=["Measurements"]),
)
class MeasurementViewSet(SoftDeleteModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

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

    def perform_destroy(self, instance):
        is_author = instance.author == self.request.user
        is_org_admin = instance.owner and OrganizationUser.objects.filter(
            user=self.request.user,
            organization=instance.owner,
            user_type__in=["OW", "AD"],
        ).exists()
        if not (is_author or is_org_admin):
            raise PermissionDenied("You do not have permission to delete this measurement.")
        instance.soft_delete(deleted_by=self.request.user)

    @action(detail=True, methods=["get"])
    def evolution(self, request, pk=None):
        """Get counts-per-second evolution over time from Parquet artifact."""
        measurement = self.get_object()
        df, err = _load_spectral_parquet(measurement)
        if err:
            return err

        channel_columns = [col for col in df.columns if col.startswith("channel_")]
        total_time = float(df["time_ms"].max() - df["time_ms"].min())
        if total_time == 0 or np.isnan(total_time) or np.isinf(total_time):
            total_time = 1.0

        row_sums = df[channel_columns].sum(axis=1)
        counts_per_second = row_sums / total_time
        counts_per_second = counts_per_second.replace([np.inf, -np.inf], 0).fillna(0)
        time_series = df["time_ms"].replace([np.inf, -np.inf], 0).fillna(0)

        evolution_values = list(
            zip(time_series.astype(float).tolist(), counts_per_second.tolist())
        )
        return Response({"evolution_values": evolution_values, "total_time": total_time})

    @action(detail=True, methods=["get"])
    def spectrum(self, request, pk=None):
        """Get energy/channel spectrum (sum over all exposures) from Parquet artifact."""
        measurement = self.get_object()
        df, err = _load_spectral_parquet(measurement)
        if err:
            return err

        channel_columns = [col for col in df.columns if col.startswith("channel_")]
        total_time = float(df["time_ms"].max() - df["time_ms"].min())
        if total_time == 0:
            total_time = 1.0

        channel_sums = df[channel_columns].sum(axis=0) / total_time
        channel_sums = channel_sums.fillna(0)

        # has_calib = measurement.calib is not None
        spectrum_values = []
        for col in channel_columns:
            channel_num = int(col.replace("channel_", ""))
            cps = float(channel_sums[col])
            # if has_calib:
            #     x_val = (measurement.calib.coef0 + channel_num * measurement.calib.coef1) / 1000
            # else:
            x_val = channel_num
            spectrum_values.append([x_val, cps])

        return Response(
            {"spectrum_values": spectrum_values, "total_time": total_time}
        )

    @action(detail=True, methods=["post"])
    def finalize(self, request, pk=None):
        measurement = self.get_object()

        if not measurement.segments.exists():
            return Response({"error": "No segments found."}, status=400)

        if measurement.processing_status == Measurement.PROCESSING_IN_PROGRESS:
            return Response({"error": "Already processing."}, status=400)

        measurement.processing_status = Measurement.PROCESSING_IN_PROGRESS
        measurement.save(update_fields=["processing_status"])

        transaction.on_commit(
            lambda: async_task('DOSPORTAL.tasks.create_measurement_artifact', measurement.id)
        )
        return Response({"status": "processing"})

@extend_schema_view(
    list=extend_schema(description="List measurement segments accessible to the current user. Filter by ?measurement=<id>.", tags=["Measurements"]),
    retrieve=extend_schema(description="Get measurement segment detail.", tags=["Measurements"]),
    create=extend_schema(
        description="Create a measurement segment. User must be a member of the measurement's organization.",
        tags=["Measurements"],
    ),
    partial_update=extend_schema(
        description="Partially update a segment (e.g. time_from, time_to, position).",
        tags=["Measurements"],
    ),
    destroy=extend_schema(
        description="Delete a measurement segment. Only accessible to the measurement author or org admin/owner.",
        tags=["Measurements"],
    ),
)
class MeasurementSegmentViewSet(ModelViewSet):
    serializer_class = MeasurementSegmentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        user_orgs = OrganizationUser.objects.filter(
            user=user, user_type__in=["OW", "AD", "ME"]
        ).values_list("organization_id", flat=True)
        qs = (
            MeasurementSegment.objects.filter(measurement__owner__in=user_orgs)
            | MeasurementSegment.objects.filter(measurement__author=user)
        ).select_related("measurement", "spectral_record").distinct().order_by("position")

        measurement_id = self.request.query_params.get("measurement")
        if measurement_id:
            qs = qs.filter(measurement__id=measurement_id)

        return qs

    def _check_measurement_permission(self, measurement):
        if measurement.owner:
            if not OrganizationUser.objects.filter(
                user=self.request.user,
                organization=measurement.owner,
                user_type__in=["OW", "AD", "ME"],
            ).exists():
                raise PermissionDenied("You do not have permission to modify segments of this measurement.")
        elif measurement.author != self.request.user:
            raise PermissionDenied("You do not have access to this measurement.")

    def perform_create(self, serializer):
        self._check_measurement_permission(serializer.validated_data["measurement"])
        serializer.save()

    def perform_update(self, serializer):
        self._check_measurement_permission(serializer.instance.measurement)
        serializer.save()

    def perform_destroy(self, instance):
        self._check_measurement_permission(instance.measurement)
        instance.delete()
