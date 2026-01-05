from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes

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
@permission_classes((AllowAny,))
def DetectorGet(request):
    items = Detector.objects.all()
    serializer = DetectorSerializer(items, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes((AllowAny,))
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
@permission_classes((AllowAny,))
def DetectorLogbookPost(request):
    serializer = DetectorLogbookSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)
