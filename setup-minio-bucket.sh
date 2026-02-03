#!/bin/bash
# Setup MinIO bucket as private (for use with pre-signed URLs)

set -e

# Load environment variables from .env if available
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration
BUCKET_NAME="${MINIO_BUCKET_NAME:-dosportal-media}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"

echo "==> Setting up private MinIO bucket: $BUCKET_NAME"

# Set alias for MinIO client
echo "==> Configuring MinIO client..."
docker-compose exec -T minio mc alias set myminio http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

# Create bucket if it doesn't exist
echo "==> Creating bucket if it doesn't exist..."
docker-compose exec -T minio mc mb myminio/$BUCKET_NAME --ignore-existing

# Remove any public policy (make it private)
echo "==> Setting bucket to private..."
docker-compose exec -T minio mc anonymous set none myminio/$BUCKET_NAME

# Verify policy
echo "==> Verifying bucket policy..."
docker-compose exec -T minio mc anonymous get myminio/$BUCKET_NAME

echo ""
echo "✓ Done! Bucket $BUCKET_NAME is now private."
echo "  Files will be accessed via Django pre-signed URLs."
