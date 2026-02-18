"""
API views for SpectralRecord management with Parquet support.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import pandas as pd

from DOSPORTAL.models import File, OrganizationUser
from DOSPORTAL.models.spectrals import SpectralRecord, SpectralRecordArtifact
from .organizations import check_org_member_permission
from ..serializers.organizations import UserSummarySerializer
from ..serializers.measurements import FileSerializer

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
        return Response(
            {'error': f'Failed to list spectral records: {str(e)}'}, 
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
        return Response(
            {'error': f'Failed to create spectral record: {str(e)}'}, 
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
        return Response(
            {'error': f'Failed to get spectral record: {str(e)}'}, 
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def SpectralRecordHistogramSimple(request, record_id):
    """Simple histogram - similar to GetHistogram but for Parquet."""
    try:
        record = SpectralRecord.objects.get(id=record_id)
        
        has_permission, _ = check_spectral_record_permission(request.user, record)
        if not has_permission:
            return Response(
                {'error': 'You do not have permission to access this record'},
                status=status.HTTP_403_FORBIDDEN
            )
        artifact = SpectralRecordArtifact.objects.get(
            spectral_record=record,
            artifact_type=SpectralRecordArtifact.SPECTRAL_FILE
        )
        
        # Read Parquet from S3 (similar to original endpoint)
        artifact.artifact.file.open('rb')
        df = pd.read_parquet(artifact.artifact.file, engine='fastparquet')
        artifact.artifact.file.close()

        channel_columns = [col for col in df.columns if col.startswith("channel_")]

        # wide → long format
        df_long = df[channel_columns].reset_index().melt(
            id_vars="index",
            var_name="channel",
            value_name="count"
        )

        df_long = df_long[df_long["count"] > 0] # remove zeros
        df_long["channel"] = df_long["channel"].str.replace("channel_", "").astype(int)

        histogram_data = df_long[["channel", "index", "count"]].values.tolist()

        return Response({"histogram_values": histogram_data})
    
        
        
    except Exception as e:
        print(f'Failed to generate histogram. {str(e)}')
        return Response({'error': "Failed to generate histogram."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def SpectralRecordHistogram(request, record_id):
    """Get histogram data from Parquet artifact."""
    try:
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
        
        # Check processing status
        if record.processing_status != SpectralRecord.PROCESSING_COMPLETED:
            return Response({
                'error': f'Processing not completed. Status: {record.processing_status}'
            }, status=status.HTTP_425_TOO_EARLY)
        
        # Get Parquet artifact
        try:
            artifact = SpectralRecordArtifact.objects.get(
                spectral_record=record,
                artifact_type=SpectralRecordArtifact.SPECTRAL_FILE
            )
        except SpectralRecordArtifact.DoesNotExist:
            return Response(
                {'error': 'Parquet artifact not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Load Parquet from S3 (wide format)
        artifact.artifact.file.open('rb')
        df = pd.read_parquet(artifact.artifact.file, engine='fastparquet')
        artifact.artifact.file.close()
        
        # Parse query parameters for filtering
        time_start = request.GET.get('time_start')
        time_end = request.GET.get('time_end')
        time_bins = int(request.GET.get('time_bins', 100))  # Default 100 bins
        
        # Apply time filtering
        if time_start is not None:
            df = df[df['time_ms'] >= float(time_start)]
        if time_end is not None:
            df = df[df['time_ms'] <= float(time_end)]
        
        if len(df) == 0:
            return Response({'histogram_values': []})
        
        # Get channel columns (all columns starting with 'channel_')
        channel_columns = [col for col in df.columns if col.startswith('channel_')]
        
        # Create time bins for aggregation
        time_min, time_max = df['time_ms'].min(), df['time_ms'].max()
        time_bin_edges = pd.cut(df['time_ms'], bins=time_bins, retbins=True)[1]
        df['time_bin'] = pd.cut(df['time_ms'], bins=time_bin_edges, labels=False)
        
        # Aggregate by time bins (sum counts per bin per channel)
        grouped = df.groupby('time_bin')[channel_columns].sum()
        
        # Convert to histogram format: [channel, time_bin, count]
        histogram_data = []
        for time_bin_idx, row in grouped.iterrows():
            # Calculate center time for this bin
            if time_bin_idx is not None and time_bin_idx < len(time_bin_edges) - 1:
                bin_center = (time_bin_edges[time_bin_idx] + time_bin_edges[time_bin_idx + 1]) / 2
            else:
                continue
                
            for channel_col in channel_columns:
                count = row[channel_col]
                if count > 0:  # Only include non-zero values
                    # Extract channel number from column name
                    channel_num = int(channel_col.replace('channel_', ''))
                    histogram_data.append([channel_num, float(bin_center), int(count)])
        
        return Response({
            'histogram_values': histogram_data,
            'metadata': {
                'total_records': len(df) if time_start is None and time_end is None else None,
                'filtered_records': len(df),
                'time_range': [float(time_min), float(time_max)],
                'time_bins': len(grouped),
                'channels': len(channel_columns),
                'non_zero_points': len(histogram_data)
            }
        })
        
    except Exception as e:
        print(f'Failed to generate histogram. {str(e)}')
        return Response(
            {'error': f'Failed to generate histogram.'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )