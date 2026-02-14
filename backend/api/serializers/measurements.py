"""Measurements relatedserializers."""

from rest_framework import serializers
from DOSPORTAL.models import Measurement, File, SpectrumData
from DOSPORTAL.models.spectrals import SpectralRecord, SpectralRecordArtifact


class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = "__all__"
        read_only_fields = ('id', 'uploaded_at', 'size')


class FileUploadSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = File
        fields = ('filename', 'file', 'file_type', 'metadata', 'owner')
        
    def validate_file(self, value):
        """Validate file size and type."""
        max_size = 250 * 1024 * 1024  # 250 MB
        if value.size > max_size:
            raise serializers.ValidationError(f"File size exceeds {max_size/1024/1024}MB limit")
        return value


class SpectrumDataSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = SpectrumData
        fields = '__all__'
        read_only_fields = ('id',)


class MeasurementsSerializer(serializers.ModelSerializer):
    files = FileSerializer(read_only=True, many=True)

    class Meta:
        model = Measurement
        fields = "__all__"


class SpectralRecordArtifactSerializer(serializers.ModelSerializer):
    """Serializer for spectral record artifacts."""
    class Meta:
        model = SpectralRecordArtifact
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class SpectralRecordSerializer(serializers.ModelSerializer):
    """Serializer for spectral records."""
    artifacts = SpectralRecordArtifactSerializer(many=True, read_only=True)
    raw_file = FileSerializer(read_only=True)
    
    class Meta:
        model = SpectralRecord
        fields = '__all__'
        read_only_fields = ('id', 'created')


class SpectralRecordCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating spectral records."""
    class Meta:
        model = SpectralRecord
        fields = ('name', 'raw_file', 'detector', 'description', 'owner', 'author')
        
    def validate_raw_file(self, value):
        """Validate that the file is of log type."""
        if value and value.file_type != File.FILE_TYPE_LOG:
            raise serializers.ValidationError("Raw file must be of type 'log'")
        return value
