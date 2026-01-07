from rest_framework import serializers
from DOSPORTAL.models import (
    measurement,
    Record,
    Detector,
    DetectorLogbook,
    DetectorType,
    DetectorManufacturer,
    Organization,
    User,
)


class DetectorManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetectorManufacturer
        fields = ("id", "name", "url")


class DetectorTypeSerializer(serializers.ModelSerializer):
    manufacturer = DetectorManufacturerSerializer(read_only=True)

    class Meta:
        model = DetectorType
        fields = ("id", "name", "manufacturer", "url", "description")


class OrganizationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug")


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name")


class DetectorSerializer(serializers.ModelSerializer):
    type = DetectorTypeSerializer(read_only=True)
    owner = OrganizationSummarySerializer(read_only=True)

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
    author = UserSummarySerializer(read_only=True)

    class Meta:
        model = DetectorLogbook
        fields = "__all__"
        read_only_fields = ["id", "author", "created"]


class MeasurementsSerializer(serializers.ModelSerializer):

    records = RecordSerializer(read_only=True, many=True)

    class Meta:
        model = measurement
        fields = "__all__"
        # fields = ('id', 'name')
        # exclude = ()
