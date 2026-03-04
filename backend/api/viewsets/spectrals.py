import logging

import numpy as np
import pandas as pd
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from drf_spectacular.types import OpenApiTypes
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from DOSPORTAL.models import OrganizationUser
from DOSPORTAL.models.spectrals import SpectralRecord, SpectralRecordArtifact
from ..serializers.measurements import (
    SpectralRecordArtifactSerializer,
    SpectralRecordCreateSerializer,
    SpectralRecordSerializer,
    SpectralRecordUpdateSerializer,
)
from ..viewsets_base import SoftDeleteModelViewSet

logger = logging.getLogger(__name__)


def _load_spectral_parquet(record):
    """Load Parquet DataFrame from a completed SpectralRecord's artifact.
    Returns (df, error_response). If error_response is not None, return it directly.
    """
    if record.processing_status != SpectralRecord.PROCESSING_COMPLETED:
        return None, Response(
            {"detail": f"Processing not completed. Status: {record.processing_status}"},
            status=status.HTTP_425_TOO_EARLY,
        )

    try:
        artifact = SpectralRecordArtifact.objects.get(
            spectral_record=record,
            artifact_type=SpectralRecordArtifact.SPECTRAL_FILE,
        )
    except SpectralRecordArtifact.DoesNotExist:
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
    list=extend_schema(
        description="List spectral records accessible to the current user.",
        tags=["Spectral Records"],
        parameters=[
            OpenApiParameter(
                "processing_status",
                OpenApiTypes.STR,
                OpenApiParameter.QUERY,
                required=False,
                description="Filter by processing status (pending/processing/completed/failed)",
            )
        ],
    ),
    retrieve=extend_schema(description="Get spectral record detail.", tags=["Spectral Records"]),
    create=extend_schema(
        description="Create a spectral record. Supply owner (org UUID) — user must be admin/owner of the organization.",
        tags=["Spectral Records"],
    ),
    evolution=extend_schema(
        description="Get counts-per-second evolution over time from Parquet artifact.",
        tags=["Spectral Records"],
    ),
    spectrum=extend_schema(
        description="Get energy/channel spectrum (sum over all exposures) from Parquet artifact.",
        tags=["Spectral Records"],
    ),
    destroy=extend_schema(description="Soft-delete a spectral record (org admin/owner only).", tags=["Spectral Records"]),
    partial_update=extend_schema(
        description="Update editable fields of a spectral record.",
        tags=["Spectral Records"],
    ),
)
class SpectralRecordViewSet(SoftDeleteModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return SpectralRecordCreateSerializer
        if self.action == "partial_update":
            return SpectralRecordUpdateSerializer
        return SpectralRecordSerializer

    def get_queryset(self):
        user = self.request.user
        user_orgs = OrganizationUser.objects.filter(
            user=user, user_type__in=["OW", "AD", "ME"]
        ).values_list("organization_id", flat=True)

        qs = (
            SpectralRecord.objects.filter(owner__in=user_orgs)
            | SpectralRecord.objects.filter(author=user)
        ).select_related("raw_file", "author", "owner", "detector", "calib").distinct()

        processing_status = self.request.query_params.get("processing_status")
        if processing_status:
            qs = qs.filter(processing_status=processing_status.lower())

        return qs.order_by("-created")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {
                **SpectralRecordSerializer(serializer.instance).data,
                "message": "SpectralRecord created, async processing scheduled",
            },
            status=status.HTTP_201_CREATED,
        )

    def perform_create(self, serializer):
        owner = serializer.validated_data.get("owner")
        if owner:
            if not OrganizationUser.objects.filter(
                user=self.request.user,
                organization=owner,
                user_type__in=["OW", "AD"],
            ).exists():
                raise PermissionDenied(
                    "You do not have permission to create spectral records for this organization."
                )
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.instance
        is_org_member = instance.owner and OrganizationUser.objects.filter(
            user=self.request.user,
            organization=instance.owner,
            user_type__in=["OW", "AD", "ME"],
        ).exists()
        is_author = instance.author == self.request.user
        if not (is_org_member or is_author):
            raise PermissionDenied("You do not have permission to edit this spectral record.")
        serializer.save()

    def perform_destroy(self, instance):
        is_org_admin = instance.owner and OrganizationUser.objects.filter(
            user=self.request.user,
            organization=instance.owner,
            user_type__in=["OW", "AD"],
        ).exists()
        is_author = instance.author == self.request.user
        if not (is_org_admin or is_author):
            raise PermissionDenied("You do not have permission to delete this spectral record.")
        instance.soft_delete(deleted_by=self.request.user)

    @action(detail=True, methods=["get"])
    def evolution(self, request, pk=None):
        """Get counts-per-second evolution over time from Parquet artifact."""
        record = self.get_object()
        df, err = _load_spectral_parquet(record)
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
        record = self.get_object()
        df, err = _load_spectral_parquet(record)
        if err:
            return err

        channel_columns = [col for col in df.columns if col.startswith("channel_")]
        total_time = float(df["time_ms"].max() - df["time_ms"].min())
        if total_time == 0:
            total_time = 1.0

        channel_sums = df[channel_columns].sum(axis=0) / total_time
        channel_sums = channel_sums.fillna(0)

        has_calib = record.calib is not None
        spectrum_values = []
        for col in channel_columns:
            channel_num = int(col.replace("channel_", ""))
            cps = float(channel_sums[col])
            if has_calib:
                x_val = (record.calib.coef0 + channel_num * record.calib.coef1) / 1000
            else:
                x_val = channel_num
            spectrum_values.append([x_val, cps])

        return Response(
            {"spectrum_values": spectrum_values, "total_time": total_time, "calib": has_calib}
        )


@extend_schema_view(
    list=extend_schema(
        description="List spectral record artifacts accessible to the current user.",
        tags=["Spectral Records"],
        parameters=[
            OpenApiParameter(
                "spectral_record",
                OpenApiTypes.UUID,
                OpenApiParameter.QUERY,
                required=False,
                description="Filter by spectral record ID",
            ),
            OpenApiParameter(
                "artifact_type",
                OpenApiTypes.STR,
                OpenApiParameter.QUERY,
                required=False,
            ),
        ],
    ),
    retrieve=extend_schema(description="Get spectral record artifact detail.", tags=["Spectral Records"]),
)
class SpectralRecordArtifactViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SpectralRecordArtifactSerializer

    def get_queryset(self):
        user = self.request.user
        user_orgs = OrganizationUser.objects.filter(
            user=user, user_type__in=["OW", "AD", "ME"]
        ).values_list("organization_id", flat=True)

        accessible_records = (
            SpectralRecord.objects.filter(owner__in=user_orgs)
            | SpectralRecord.objects.filter(author=user)
        ).distinct()

        qs = SpectralRecordArtifact.objects.filter(
            spectral_record__in=accessible_records
        ).select_related("artifact", "spectral_record").order_by("created_at")

        spectral_record = self.request.query_params.get("spectral_record")
        if spectral_record:
            qs = qs.filter(spectral_record_id=spectral_record)

        artifact_type = self.request.query_params.get("artifact_type")
        if artifact_type:
            qs = qs.filter(artifact_type=artifact_type)

        return qs
