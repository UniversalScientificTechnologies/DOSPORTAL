from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes

from drf_spectacular.utils import extend_schema

from DOSPORTAL.models import Measurement
from ..serializers import MeasurementsSerializer


@extend_schema(tags=["Measurements"])
@api_view(["GET"])
@permission_classes((AllowAny,))
def MeasurementsGet(request):
    items = Measurement.objects.all()
    serializer = MeasurementsSerializer(items, many=True)
    return Response(serializer.data)


@extend_schema(tags=["Measurements"])
@api_view(["POST"])
@permission_classes((AllowAny,))
def MeasurementsPost(request):
    serializer = MeasurementsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)