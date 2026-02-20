from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from DOSPORTAL.models import Measurement
from ..serializers import MeasurementsSerializer
from .organizations import get_user_organizations, check_org_member_permission


@extend_schema(
    tags=["Measurements"],
    description="Get list of measurements accessible to the current user (filtered by organization membership)"
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def MeasurementsGet(request):
    # Filter: measurements from user's organizations OR authored by user
    user_orgs = get_user_organizations(request.user)
    queryset = Measurement.objects.filter(
        owner__in=user_orgs
    ) | Measurement.objects.filter(author=request.user)
    
    # Order by most recent first
    queryset = queryset.order_by('-time_created').distinct()
    
    serializer = MeasurementsSerializer(queryset, many=True)
    return Response(serializer.data)


@extend_schema(tags=["Measurements"])
@api_view(["POST"])
@permission_classes((AllowAny,))
def MeasurementsPost(request):
    serializer = MeasurementsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)


@extend_schema(
    responses={200: MeasurementsSerializer},
    description="Get measurement detail by ID",
    tags=["Measurements"],
    parameters=[
        OpenApiParameter(
            name="measurement_id",
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description="Measurement ID",
        )
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def MeasurementDetail(request, measurement_id):
    """
    Get detailed information about a specific measurement.
    User must be a member of the measurement's organization or the author.
    """
    try:
        measurement = Measurement.objects.get(id=measurement_id)
    except Measurement.DoesNotExist:
        return Response(
            {'error': 'Measurement not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permission: user is author OR member of owner organization
    if measurement.author == request.user:
        # Author always has access
        serializer = MeasurementsSerializer(measurement)
        return Response(serializer.data)
    
    if measurement.owner:
        has_permission, _ = check_org_member_permission(request.user, measurement.owner)
        if has_permission:
            serializer = MeasurementsSerializer(measurement)
            return Response(serializer.data)
    
    return Response(
        {'error': 'You do not have permission to access this measurement'},
        status=status.HTTP_403_FORBIDDEN
    )