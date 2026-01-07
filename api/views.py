from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from django.utils.dateparse import parse_datetime
from DOSPORTAL.models import measurement, Record, DetectorLogbook, Detector
from .serializers import (
    MeasurementsSerializer,
    RecordSerializer,
    DetectorLogbookSerializer,
    DetectorSerializer,
)


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

    data = dict(request.data)
    data["author"] = request.user.id

    detector_id = data.get("detector")
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

    serializer = DetectorLogbookSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
