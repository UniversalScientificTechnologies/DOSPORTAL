"""Measurements relatedserializers."""

from rest_framework import serializers
from DOSPORTAL.models import Measurement, File


class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = "__all__"


class MeasurementsSerializer(serializers.ModelSerializer):
    files = FileSerializer(read_only=True, many=True)

    class Meta:
        model = Measurement
        fields = "__all__"
