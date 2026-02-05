import boto3
from botocore.client import Config
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Setup MinIO bucket - create if not exists and set as private'

    def handle(self, *args, **options):
        self.stdout.write('==> Setting up MinIO bucket...')
        
        # Get settings
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        endpoint_url = settings.AWS_S3_ENDPOINT_URL
        access_key = settings.AWS_ACCESS_KEY_ID
        secret_key = settings.AWS_SECRET_ACCESS_KEY
        region = settings.AWS_S3_REGION_NAME
        
        self.stdout.write(f'Bucket: {bucket_name}')
        self.stdout.write(f'Endpoint: {endpoint_url}')
        
        try:
            # Create S3 client
            s3_client = boto3.client(
                's3',
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region,
                config=Config(signature_version='s3v4')
            )
            
            # Check if bucket exists
            try:
                s3_client.head_bucket(Bucket=bucket_name)
                self.stdout.write(self.style.SUCCESS(f'✓ Bucket {bucket_name} already exists'))
            except Exception:
                # Create bucket
                self.stdout.write(f'Creating bucket {bucket_name}...')
                s3_client.create_bucket(Bucket=bucket_name)
                self.stdout.write(self.style.SUCCESS(f'✓ Bucket {bucket_name} created'))
            
            # Remove any public policy (make it private)
            self.stdout.write('Setting bucket to private...')
            try:
                s3_client.delete_bucket_policy(Bucket=bucket_name)
            except Exception:
                pass  # No policy to delete
            
            # Verify bucket is accessible
            s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=1)
            self.stdout.write(self.style.SUCCESS('✓ Bucket is accessible'))
            
            self.stdout.write(self.style.SUCCESS(f'\n✓ Done! Bucket {bucket_name} is configured as private.'))
            self.stdout.write('  Files will be accessed via Django pre-signed URLs.')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error setting up MinIO: {str(e)}'))
            raise
