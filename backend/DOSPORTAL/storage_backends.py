from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings


class MinIOMediaStorage(S3Boto3Storage):
    """
    Custom storage backend for MinIO that handles URL generation
    for access through nginx reverse proxy.
    """
    
    def url(self, name, parameters=None, expire=None, http_method=None):
        # Generate the pre-signed URL using the internal endpoint
        url = super().url(name, parameters, expire, http_method)
        
        # Replace internal endpoint with public URL if configured
        public_url = getattr(settings, 'MINIO_PUBLIC_URL', None)
        internal_url = settings.AWS_S3_ENDPOINT_URL
        
        if public_url and internal_url in url:
            # Replace internal URL with public URL
            url = url.replace(internal_url, public_url)
        
        return url
