"""Detector related serializers."""

from rest_framework import serializers
from DOSPORTAL.models import (
    DetectorManufacturer,
    DetectorType,
    Detector,
    DetectorLogbook,
)
from .organizations import OrganizationSummarySerializer, UserSummarySerializer


class DetectorManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetectorManufacturer
        fields = ("id", "name", "url")


class DetectorTypeSerializer(serializers.ModelSerializer):

    manufacturer = serializers.PrimaryKeyRelatedField(
        queryset=DetectorManufacturer.objects.all()
    )
    image = serializers.ImageField(read_only=True)

    class Meta:
        model = DetectorType
        fields = ("id", "name", "manufacturer", "url", "description", "image")

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["manufacturer"] = (
            DetectorManufacturerSerializer(instance.manufacturer).data
            if instance.manufacturer
            else None
        )
        return rep


class DetectorSerializer(serializers.ModelSerializer):

    owner = OrganizationSummarySerializer(read_only=True)
    type = DetectorTypeSerializer(read_only=True)
    type_id = serializers.PrimaryKeyRelatedField(
        source="type",
        queryset=DetectorType.objects.all(),
        required=True,
        write_only=False,
    )

    class Meta:
        model = Detector
        fields = "__all__"
        extra_fields = ["type_id"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["type_id"] = str(instance.type.id) if instance.type else None
        rep["owner"] = str(instance.owner.id) if instance.owner else None
        return rep


class DetectorLogbookSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    modified_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = DetectorLogbook
        fields = "__all__"
        read_only_fields = ["id", "author", "created", "modified", "modified_by"]
