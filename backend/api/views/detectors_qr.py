from django.http import HttpResponse
import logging

from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from DOSPORTAL.models import Detector
from ..qr_utils import generate_qr_code, generate_qr_detector_with_label

logger = logging.getLogger("api.detectors")


@extend_schema(
    description="Generate QR code for a specific detector",
    tags=["Detectors"],
    parameters=[
        OpenApiParameter(
            name="detector_id",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="Detector ID",
        ),
        OpenApiParameter(
            name="label",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Include detector label (name and serial number) - true/false",
        ),
    ],
)
@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def DetectorQRCode(request, detector_id):
    """
    Generate QR code for a specific detector.

    Query params:
    - label: 'true' to include detector name and serial number
    """
    try:
        detector = Detector.objects.select_related("type").get(id=detector_id)
    except Detector.DoesNotExist:
        return Response(
            {"detail": "Detector not found."}, status=status.HTTP_404_NOT_FOUND
        )

    # Build the logbook creation URL
    base_url = request.build_absolute_uri("/").rstrip("/")
    logbook_url = f"{base_url}/logbook/{detector.id}/create"

    # Get query parameters
    include_label = request.query_params.get("label", "false").lower() == "true"

    # Generate QR code
    try:
        if include_label:
            qr_buffer = generate_qr_detector_with_label(
                url=logbook_url, detector_name=detector.name, serial_number=detector.sn
            )
        else:
            qr_buffer = generate_qr_code(url=logbook_url)

        response = HttpResponse(qr_buffer.read(), content_type="image/png")
        filename = f"detector_{detector.sn}_qr.png"
        response["Content-Disposition"] = f'inline; filename="{filename}"'

        return response

    except Exception as e:
        logger.error(
            "DetectorQRCode user=%s auth=%s header=%s error=%s",
            request.user,
            request.auth,
            "present" if request.headers.get("Authorization") else "missing",
            str(e),
        )
        return Response(
            {"detail": "Error generating QR code."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
