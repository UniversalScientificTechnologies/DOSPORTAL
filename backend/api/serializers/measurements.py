"""Measurements and Records serializers."""

from rest_framework import serializers
from DOSPORTAL.models import measurement, Record


class RecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Record
        fields = "__all__"


class MeasurementsSerializer(serializers.ModelSerializer):
    records = RecordSerializer(read_only=True, many=True)

    class Meta:
        model = measurement
        fields = "__all__"
