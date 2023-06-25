from rest_framework import serializers
from DOSPORTAL.models import measurement, record, Detector




class DetectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detector
        fields = '__all__'

class RecordSerializer(serializers.ModelSerializer):
    #detector = DetectorSerializer(read_only = True, many=True)
    class Meta:
        model = record
        fields = '__all__'


class MeasurementsSerializer(serializers.ModelSerializer):

    records = RecordSerializer(read_only = True, many=True)
    class Meta:
        model = measurement
        fields = '__all__'
        #fields = ('id', 'name')
        #exclude = ()