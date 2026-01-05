from rest_framework import serializers
from DOSPORTAL.models import measurement, Record, Detector, DetectorLogbook


class DetectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detector
        fields = "__all__"


class RecordSerializer(serializers.ModelSerializer):
    # detector = DetectorSerializer(read_only = True, many=True)
    class Meta:
        model = Record
        # fields = ['id', 'name', 'description', ]
        fields = "__all__"


class DetectorLogbookSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetectorLogbook
        fields = "__all__"


class MeasurementsSerializer(serializers.ModelSerializer):

    records = RecordSerializer(read_only=True, many=True)

    class Meta:
        model = measurement
        fields = "__all__"
        # fields = ('id', 'name')
        # exclude = ()
