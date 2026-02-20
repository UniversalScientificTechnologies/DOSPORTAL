"""
API views for SpectralRecord management with Parquet support.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import pandas as pd
import numpy as np

import logging
from DOSPORTAL.models import File, OrganizationUser
from DOSPORTAL.models.spectrals import SpectralRecord, SpectralRecordArtifact
from .organizations import check_org_member_permission
from ..serializers.organizations import UserSummarySerializer
from ..serializers.measurements import FileSerializer

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def SpectralRecordList(request):
    """List spectral records filtered by user's organization membership."""
    try:
        user_orgs = OrganizationUser.objects.filter(
            user=request.user,
            user_type__in=["OW", "AD", "ME"]
        ).values_list('organization_id', flat=True)
        
        queryset = SpectralRecord.objects.filter(
            owner__in=user_orgs
        ) | SpectralRecord.objects.filter(author=request.user)
        
        queryset = queryset.select_related('raw_file', 'author', 'owner').distinct()
        
        data = []
        for record in queryset:
            data.append({
                'id': str(record.id),
                'name': record.name,
                'processing_status': record.processing_status,
                'created': record.created.isoformat(),
                'author': record.author.username if record.author else None,
                'owner': record.owner.name if record.owner else None,
                'raw_file_id': str(record.raw_file.id) if record.raw_file else None,
                'artifacts_count': record.artifacts.count()
            })
        
        return Response(data)
        
    except Exception as e:
        logger.exception(f"Failed to list spectral records: {str(e)}")
        return Response(
            {'error': 'Failed to list spectral records'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def SpectralRecordCreate(request):
    """Create a new SpectralRecord (triggers async processing)."""
    try:
        data = request.data
        
        # Get raw file
        raw_file_id = data.get('raw_file_id')
        if not raw_file_id:
            return Response(
                {'error': 'raw_file_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            raw_file = File.objects.get(id=raw_file_id, file_type=File.FILE_TYPE_LOG)
        except File.DoesNotExist:
            return Response(
                {'error': 'Raw file not found or not a log file'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user wants to set explicit owner
        owner_id = data.get('owner')
        if owner_id:
            # Check if user has permission to create records in this organization
            org_user = OrganizationUser.objects.filter(
                user=request.user,
                organization_id=owner_id,
                user_type__in=["OW", "AD"]
            ).first()
            
            if not org_user:
                return Response(
                    {'error': 'You do not have permission to create records in this organization'},
                    status=status.HTTP_403_FORBIDDEN
                )
            owner = org_user.organization
        else:
            # Use raw file's owner by default
            owner = raw_file.owner
        
        record = SpectralRecord.objects.create(
            name=data.get('name', 'Spectral Record'),
            raw_file=raw_file,
            author=request.user,
            owner=owner,
            description=data.get('description', ''),
            processing_status=SpectralRecord.PROCESSING_PENDING
        )
        
        return Response({
            'id': str(record.id),
            'name': record.name,
            'processing_status': record.processing_status,
            'message': 'SpectralRecord created, async processing scheduled'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.exception(f'Failed to create spectral record: {str(e)}')
        return Response(
            {'error': 'Failed to create spectral record.'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def check_spectral_record_permission(user, record):
    """Check if user has access to spectral record."""
    if not record.owner:
        return user == record.author, None
    else:
        return check_org_member_permission(user, record.owner)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def SpectralRecordDetail(request, record_id):
    """Get details of a single spectral record."""
    try:
        try:
            record = SpectralRecord.objects.select_related('raw_file', 'author', 'owner').get(id=record_id)
        except SpectralRecord.DoesNotExist:
            return Response(
                {'error': 'SpectralRecord not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        has_permission, _ = check_spectral_record_permission(request.user, record)
        if not has_permission:
            return Response(
                {'error': 'You do not have permission to access this record'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = {
            'id': str(record.id),
            'name': record.name,
            'processing_status': record.processing_status,
            'created': record.created.isoformat(),
            'author': UserSummarySerializer(record.author).data if record.author else None,
            'owner': record.owner.name if record.owner else None,
            'raw_file_id': str(record.raw_file.id) if record.raw_file else None,
            'artifacts_count': record.artifacts.count(),
            'description': record.description,
        }
        
        return Response(data)
        
    except Exception as e:
        logger.exception(f'Failed to get spectral record: {str(e)}')
        return Response(
            {'error': 'Failed to get spectral record.'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def SpectralRecordArtifactList(request):
    try:
        # Get query parameters
        record_id = request.GET.get('record_id')
        artifact_type = request.GET.get('artifact_type')
        
        if not record_id:
            return Response(
                {'error': 'record_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            record = SpectralRecord.objects.get(id=record_id)
        except SpectralRecord.DoesNotExist:
            return Response(
                {'error': 'SpectralRecord not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        has_permission, _ = check_spectral_record_permission(request.user, record)
        if not has_permission:
            return Response(
                {'error': 'You do not have permission to access this record'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Build queryset with filters
        queryset = SpectralRecordArtifact.objects.filter(
            spectral_record=record
        ).select_related('artifact', 'artifact__author', 'artifact__owner')
        
        if artifact_type:
            queryset = queryset.filter(artifact_type=artifact_type)
        
        queryset = queryset.order_by('created_at')
        
        data = []
        for artifact in queryset:
            artifact_data = {
                'id': str(artifact.id),
                'artifact_type': artifact.artifact_type,
                'created_at': artifact.created_at.isoformat(),
                'file': FileSerializer(artifact.artifact).data if artifact.artifact else None
            }
            data.append(artifact_data)
        
        return Response(data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to list spectral record artifacts: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _load_spectral_parquet(record):
    """Load Parquet DataFrame from a completed SpectralRecord's artifact.
    Returns (df, error_response). If error_response is not None, return it directly.
    """
    if record.processing_status != SpectralRecord.PROCESSING_COMPLETED:
        return None, Response(
            {'error': f'Processing not completed. Status: {record.processing_status}'},
            status=status.HTTP_425_TOO_EARLY
        )

    try:
        artifact = SpectralRecordArtifact.objects.get(
            spectral_record=record,
            artifact_type=SpectralRecordArtifact.SPECTRAL_FILE
        )
    except SpectralRecordArtifact.DoesNotExist:
        return None, Response(
            {'error': 'Parquet artifact not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    artifact.artifact.file.open('rb')
    df = pd.read_parquet(artifact.artifact.file, engine='fastparquet')
    artifact.artifact.file.close()
    
    channel_cols = [col for col in df.columns if col.startswith('channel_')]
    df[channel_cols] = df[channel_cols].fillna(0)
    return df, None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def SpectralRecordEvolution(request, record_id):
    """Get counts-per-second evolution over time from Parquet artifact.

    Returns {evolution_values: [[time_ms, cps], ...], total_time: float}
    """
    try:

        try:
            record = SpectralRecord.objects.select_related('calib').get(id=record_id)
        except SpectralRecord.DoesNotExist:
            return Response({'error': 'SpectralRecord not found'}, status=status.HTTP_404_NOT_FOUND)

        has_permission, _ = check_spectral_record_permission(request.user, record)
        if not has_permission:
            return Response({'error': 'You do not have permission to access this record'}, status=status.HTTP_403_FORBIDDEN)

        df, err = _load_spectral_parquet(record)
        if err:
            return err

        channel_columns = [col for col in df.columns if col.startswith('channel_')]

        total_time = float(df['time_ms'].max() - df['time_ms'].min())
        if total_time == 0 or np.isnan(total_time) or np.isinf(total_time):
            total_time = 1.0  # avoid division by zero for single-row data

        row_sums = df[channel_columns].sum(axis=1)
        counts_per_second = row_sums / total_time 

        # Replace any NaN/inf with 0 to ensure JSON serialization
        counts_per_second = counts_per_second.replace([np.inf, -np.inf], 0).fillna(0)
        time_series = df['time_ms'].replace([np.inf, -np.inf], 0).fillna(0)

        evolution_values = list(zip(time_series.astype(float).tolist(), counts_per_second.tolist()))

        return Response({
            'evolution_values': evolution_values,
            'total_time': total_time,
        })

    except Exception as e:
        print(f'Failed to generate evolution. {str(e)}')
        return Response({'error': 'Failed to generate evolution data.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def SpectralRecordSpectrum(request, record_id):
    """Get energy/channel spectrum (sum over all exposures) from Parquet artifact.

    Returns {spectrum_values: [[channel_or_keV, cps], ...], total_time: float, calib: bool}
    """
    try:
        try:
            record = SpectralRecord.objects.select_related('calib').get(id=record_id)
        except SpectralRecord.DoesNotExist:
            return Response({'error': 'SpectralRecord not found'}, status=status.HTTP_404_NOT_FOUND)

        has_permission, _ = check_spectral_record_permission(request.user, record)
        if not has_permission:
            return Response({'error': 'You do not have permission to access this record'}, status=status.HTTP_403_FORBIDDEN)

        df, err = _load_spectral_parquet(record)
        if err:
            return err

        channel_columns = [col for col in df.columns if col.startswith('channel_')]

        total_time = float(df['time_ms'].max() - df['time_ms'].min())
        if total_time == 0:
            total_time = 1.0

        # Sum all rows per channel → total counts, then divide by time → cps
        channel_sums = df[channel_columns].sum(axis=0) / total_time
        channel_sums = channel_sums.fillna(0)

        has_calib = record.calib is not None
        spectrum_values = []
        for col in channel_columns:
            channel_num = int(col.replace('channel_', ''))
            cps = float(channel_sums[col])
            if has_calib:
                x_val = (record.calib.coef0 + channel_num * record.calib.coef1) / 1000  # keV
            else:
                x_val = channel_num
            spectrum_values.append([x_val, cps])

        return Response({
            'spectrum_values': spectrum_values,
            'total_time': total_time,
            'calib': has_calib,
        })

    except Exception as e:
        print(f'Failed to generate spectrum. {str(e)}')
        return Response({'error': 'Failed to generate spectrum data.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)