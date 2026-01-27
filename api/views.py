from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.http import HttpResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User as DjangoUser
import os
import logging

from django.utils.dateparse import parse_datetime
from DOSPORTAL.models import (
    measurement,
    Record,
    DetectorLogbook,
    Detector,
    OrganizationUser,
    User,
    Organization,
)
from .serializers import (
    MeasurementsSerializer,
    RecordSerializer,
    DetectorLogbookSerializer,
    DetectorSerializer,
    UserProfileSerializer,
    OrganizationUserSerializer,
    OrganizationDetailSerializer,
)
from .qr_utils import generate_qr_code, generate_qr_detector_with_label

logger = logging.getLogger("api.auth")


@api_view(["POST"])
@permission_classes((AllowAny,))
def Login(request):
    """API login endpoint that accepts username and password."""
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"detail": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)

    if user is not None:
        token, created = Token.objects.get_or_create(user=user)
        return Response(
            {
                "detail": "Login successful.",
                "username": user.username,
                "token": token.key,
            },
            status=status.HTTP_200_OK,
        )
    else:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )


@api_view(["POST"])
@permission_classes((AllowAny,))
def Signup(request):
    """API signup endpoint that creates a new user account."""
    username = request.data.get("username")
    password = request.data.get("password")
    password_confirm = request.data.get("password_confirm")
    email = request.data.get("email", "")

    if not username or not password or not password_confirm:
        return Response(
            {"detail": "Username, password, and password confirmation are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if password != password_confirm:
        return Response(
            {"detail": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 8:
        return Response(
            {"detail": "Password must be at least 8 characters long."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if DjangoUser.objects.filter(username=username).exists():
        return Response(
            {"detail": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = DjangoUser.objects.create_user(
            username=username, password=password, email=email
        )
        token, created = Token.objects.get_or_create(user=user)
        return Response(
            {
                "detail": "Account created successfully.",
                "username": user.username,
                "token": token.key,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {"detail": f"Error creating account: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def Logout(request):
    """API logout endpoint. Delete the token."""
    request.user.auth_token.delete()
    return Response(
        {"detail": "Logout successful."},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes((AllowAny,))
def Version(request):
    """Return git version information."""
    return Response({
        "git_commit": os.getenv("GIT_COMMIT", "unknown"),
        "git_branch": os.getenv("GIT_BRANCH", "unknown"),
    })


@api_view(["GET"])
@permission_classes((AllowAny,))
def MeasurementsGet(request):
    items = measurement.objects.all()
    serializer = MeasurementsSerializer(items, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes((AllowAny,))
def MeasurementsPost(request):
    serializer = MeasurementsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)


@api_view(["GET"])
@permission_classes((AllowAny,))
def RecordGet(request):
    items = Record.objects.all()
    serializer = RecordSerializer(items, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def DetectorGet(request):
    logger.info(
        "DetectorGet user=%s auth=%s header=%s",
        request.user,
        request.auth,
        "present" if request.headers.get("Authorization") else "missing",
    )
    items = Detector.objects.select_related("type__manufacturer", "owner").all()
    serializer = DetectorSerializer(items, many=True)
    return Response(serializer.data)


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


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def UserOrganizations(request):
    """Get all organizations that the current user is a member of."""
    org_users = OrganizationUser.objects.filter(user=request.user).select_related(
        "organization"
    )
    serializer = OrganizationUserSerializer(org_users, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def AddOrganizationMember(request, org_id):
    """Add a user to an organization by username. Only owner/admin can add."""
    username = request.data.get("username")
    user_type = request.data.get("user_type", "ME")
    if not username:
        return Response({"detail": "Username required."}, status=400)
    try:
        org = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response({"detail": "Organization not found."}, status=404)
    
    # Only allow owner/admin to add
    org_user = OrganizationUser.objects.filter(user=request.user, organization=org).first()
    if not org_user or org_user.user_type not in ["OW", "AD"]:
        return Response({"detail": "You do not have permission to add members."}, status=403)
    try:
        user = DjangoUser.objects.get(username=username)
    except DjangoUser.DoesNotExist:
        return Response({"detail": "User not found."}, status=404)
    if OrganizationUser.objects.filter(user=user, organization=org).exists():
        return Response({"detail": "User already a member."}, status=400)
    OrganizationUser.objects.create(user=user, organization=org, user_type=user_type)
    return Response({"detail": "User added."}, status=201)


@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def Organizations(request):
    if request.method == "POST":
        name = request.data.get("name")
        data_policy = request.data.get("data_policy", "PU")
        website = request.data.get("website", "")
        contact_email = request.data.get("contact_email", "")
        description = request.data.get("description", "")

        if not name:
            return Response(
                {"detail": "Organization name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            org = Organization.objects.create(
                name=name,
                data_policy=data_policy,
                website=website,
                contact_email=contact_email,
                description=description,
            )
            # Add creator as owner
            OrganizationUser.objects.create(
                user=request.user, organization=org, user_type="OW"
            )
            serializer = OrganizationDetailSerializer(org)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": f"Error creating organization: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@api_view(["GET", "PUT"])
@permission_classes((IsAuthenticated,))
def OrganizationDetail(request, org_id):
    try:
        org = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response(
            {"detail": "Organization not found."}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = OrganizationDetailSerializer(org)
        return Response(serializer.data)

    elif request.method == "PUT":
        # Check if user is owner or admin
        org_user = OrganizationUser.objects.filter(
            user=request.user, organization=org
        ).first()
        if not org_user or org_user.user_type not in ["OW", "AD"]:
            return Response(
                {"detail": "You do not have permission to edit this organization."},
                status=status.HTTP_403_FORBIDDEN,
            )

        allowed_fields = ["name", "data_policy", "website", "contact_email", "description"]
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = OrganizationDetailSerializer(org, data=update_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        return Response(
            {"detail": f"Error generating QR code: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
