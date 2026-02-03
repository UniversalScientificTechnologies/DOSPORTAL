from django.utils.dateparse import parse_datetime
from django.http import HttpResponse
import logging

from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from DOSPORTAL.models import (
    Detector,
    DetectorManufacturer,
    DetectorType,
    DetectorLogbook,
    Organization,
)
from ..serializers import (
    DetectorSerializer,
    DetectorTypeSerializer,
    DetectorManufacturerSerializer,
    DetectorLogbookSerializer,
)
from ..qr_utils import generate_qr_code, generate_qr_detector_with_label

logger = logging.getLogger("api.detectors")


def check_org_admin_permission(user, org):
    """
    Check if user is admin or owner of the organization.
    Returns (has_permission: bool, org_user: OrganizationUser|None)
    """
    from DOSPORTAL.models import OrganizationUser

    org_user = OrganizationUser.objects.filter(user=user, organization=org).first()
    has_permission = org_user and org_user.user_type in ["OW", "AD"]
    return has_permission, org_user


@extend_schema(tags=["Detectors"])
@api_view(["GET", "POST"])
@permission_classes((AllowAny,))
def DetectorManufacturer(request):
    """Get all detector manufacturers or add a new one."""
    if request.method == "GET":
        items = DetectorManufacturer.objects.all()
        serializer = DetectorManufacturerSerializer(items, many=True)
        return Response(serializer.data)
    elif request.method == "POST":
        serializer = DetectorManufacturerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@extend_schema(tags=["Detectors"])
@api_view(["GET"])
@permission_classes((AllowAny,))
def DetectorManufacturerDetail(request, manufacturer_id):
    """Get detector manufacturer by id."""
    try:
        item = DetectorManufacturer.objects.get(id=manufacturer_id)
    except DetectorManufacturer.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)
    serializer = DetectorManufacturerSerializer(item)
    return Response(serializer.data)


@extend_schema(
    responses={200: DetectorTypeSerializer(many=True)},
    request=DetectorTypeSerializer,
    description="Get all detector types or create a new detector type",
    tags=["Detectors"],
)
@api_view(["GET", "POST"])
@permission_classes((IsAuthenticated,))
def DetectorTypeList(request):
    """Get all detector types or create a new one."""
    if request.method == "GET":
        items = DetectorType.objects.select_related("manufacturer").all()
        serializer = DetectorTypeSerializer(items, many=True)
        return Response(serializer.data)
    elif request.method == "POST":
        serializer = DetectorTypeSerializer(data=request.data)
        if serializer.is_valid():
            dtype = serializer.save()
            return Response(
                DetectorTypeSerializer(dtype).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Detectors"])
@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def DetectorTypeDetail(request, type_id):
    """Get detector type by id."""
    try:
        item = DetectorType.objects.get(id=type_id)
    except DetectorType.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)
    serializer = DetectorTypeSerializer(item, context={"request": request})
    return Response(serializer.data)


@extend_schema(
    responses={200: DetectorSerializer(many=True)},
    request=DetectorSerializer,
    description="Get all detectors or create a new detector",
    tags=["Detectors"],
)
@api_view(["GET", "POST"])
@permission_classes((IsAuthenticated,))
def DetectorGet(request):
    logger.info(
        "DetectorGet user=%s auth=%s header=%s",
        request.user,
        request.auth,
        "present" if request.headers.get("Authorization") else "missing",
    )
    if request.method == "GET":
        items = Detector.objects.select_related("type__manufacturer", "owner").all()
        serializer = DetectorSerializer(items, many=True)
        return Response(serializer.data)
    elif request.method == "POST":
        data = request.data.copy()
        owner_id = data.get("owner")
        if not owner_id:
            return Response(
                {"detail": "Owner organization is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            org = Organization.objects.get(id=owner_id)
        except Organization.DoesNotExist:
            return Response(
                {"detail": "Organization not found."}, status=status.HTTP_404_NOT_FOUND
            )
        has_permission, _ = check_org_admin_permission(request.user, org)
        if not has_permission:
            return Response(
                {
                    "detail": "You do not have permission to add detectors to this organization."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Ensure owner is in access
        access_ids = set()
        if "access" in data and isinstance(data["access"], list):
            access_ids = set(str(a) for a in data["access"])
        owner_id_str = str(owner_id)
        access_ids.add(owner_id_str)
        data["access"] = list(access_ids)

        serializer = DetectorSerializer(data=data)
        if serializer.is_valid():
            detector = serializer.save(owner=org)
            return Response(
                DetectorSerializer(detector).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Detectors"])
@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def DetectorLogbookGet(request):
    items = DetectorLogbook.objects.select_related("detector", "author").all()

    detector_id = request.query_params.get("detector")
    if detector_id:
        items = items.filter(detector_id=detector_id)

    entry_type = request.query_params.get("entry_type")
    if entry_type:
        items = items.filter(entry_type=entry_type)

    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")

    if date_from:
        parsed_from = parse_datetime(date_from)
        if parsed_from:
            items = items.filter(created__gte=parsed_from)

    if date_to:
        parsed_to = parse_datetime(date_to)
        if parsed_to:
            items = items.filter(created__lte=parsed_to)

    serializer = DetectorLogbookSerializer(items, many=True)
    return Response(serializer.data)


@extend_schema(tags=["Detectors"])
@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def DetectorLogbookPost(request):
    detector_id = request.data.get("detector")
    if detector_id:
        try:
            detector = Detector.objects.get(id=detector_id)
            user_has_access = (
                detector.owner and request.user in detector.owner.users.all()
            ) or detector.access.filter(users=request.user).exists()

            if not user_has_access:
                return Response(
                    {"detail": "Access to the detector denied."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Detector.DoesNotExist:
            return Response(
                {"detail": "Detektor not found."}, status=status.HTTP_404_NOT_FOUND
            )

    serializer = DetectorLogbookSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Detectors"])
@api_view(["PUT"])
@permission_classes((IsAuthenticated,))
def DetectorLogbookPut(request, entry_id):
    try:
        entry = DetectorLogbook.objects.get(id=entry_id)
    except DetectorLogbook.DoesNotExist:
        return Response(
            {"detail": "Logbook entry not found."}, status=status.HTTP_404_NOT_FOUND
        )

    # Check if user has access to modify this entry
    detector = entry.detector
    user_has_access = (
        detector.owner and request.user in detector.owner.users.all()
    ) or detector.access.filter(users=request.user).exists()

    if not user_has_access:
        return Response(
            {"detail": "Access to the detector denied."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Only allow updating specific fields
    allowed_fields = [
        "text",
        "entry_type",
        "latitude",
        "longitude",
        "altitude",
        "location_text",
        "public",
    ]
    update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

    serializer = DetectorLogbookSerializer(entry, data=update_data, partial=True)
    if serializer.is_valid():
        serializer.save(modified_by=request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Detectors"])
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
            {"detail": f"Error generating QR code."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
