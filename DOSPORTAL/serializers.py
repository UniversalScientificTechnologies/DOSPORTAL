from rest_framework import serializers
from .models import measurement

class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = measurement
        fields = ["id", "time_start", "author", "name", "description"]