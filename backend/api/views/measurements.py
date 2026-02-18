from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from drf_spectacular.utils import extend_schema

from DOSPORTAL.models import Measurement
from ..serializers import MeasurementsSerializer
from .organizations import get_user_organizations


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