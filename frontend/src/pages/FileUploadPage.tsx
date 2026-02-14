import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { FileDropzone } from '../components/FileDropzone';
import { LabeledInput } from '../components/LabeledInput';
import { theme } from '../theme';

export const FileUploadPage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string;
  isAuthed: boolean;
  getAuthHeader: () => { Authorization?: string };
}) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<'log' | 'trajectory' | 'document' | 'image' | 'other'>('log');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Auto-fill name from filename if empty
    if (!fileName) {
      setFileName(file.name);
    }
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file');
      return;
    }

    if (!fileName.trim()) {
      setUploadError('Please enter a file name');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const fileFormData = new FormData();
      fileFormData.append('file', selectedFile);
      fileFormData.append('filename', fileName);
      fileFormData.append('file_type', fileType);

      const fileResponse = await fetch(`${apiBase}/file/upload/`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
        },
        body: fileFormData,
      });

      if (!fileResponse.ok) {
        const errorData = await fileResponse.json();
        throw new Error(errorData.error || errorData.detail || `File upload failed: ${fileResponse.status}`);
      }

      const fileData = await fileResponse.json();
      
      // Create SpectralRecord (only for log files)
      if (fileType === 'log') {
        const recordResponse = await fetch(`${apiBase}/spectral-record/create/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            raw_file_id: fileData.id,
            name: fileName,
            description: description,
          }),
        });

        if (!recordResponse.ok) {
          const errorData = await recordResponse.json();
          throw new Error(errorData.error || `SpectralRecord creation failed: ${recordResponse.status}`);
        }

        const recordData = await recordResponse.json();
        // TODO: Redirect to spectral record detail page
        // navigate(`/spectral-records/${recordData.id}`);
      } else {
        // navigate('/...');
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    navigate('/files');
  };

  if (!isAuthed) {
    return (
      <PageLayout>
        <p style={{ color: theme.colors.textSecondary }}>
          Please log in to upload files.
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: theme.spacing['2xl'] }}>
          <FileDropzone
            onFileSelect={handleFileSelect}
            accept=".txt,.log,.csv,.json,.bin"
            maxSizeMB={250}
            disabled={isUploading}
          />
        </div>

        {selectedFile && (
          <div style={{
            marginBottom: theme.spacing['2xl'],
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.successBg,
            borderRadius: theme.borders.radius.sm,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <p style={{ 
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.xs,
            }}>
              <strong> Selected file: </strong> {selectedFile.name}
            </p>
            <p style={{ 
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.muted,
            }}>
              <strong> size: </strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        <div style={{ marginBottom: theme.spacing.xl }}>
          <LabeledInput
            id="file-name"
            label="File Name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter a descriptive name"
            disabled={isUploading}
            required
          />
        </div>

        {fileType === 'log' && (
          <div style={{ marginBottom: theme.spacing.xl }}>
            <label style={{
              display: 'block',
              marginBottom: theme.spacing.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.textSecondary,
            }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this measurement..."
              disabled={isUploading}
              rows={3}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                border: `${theme.borders.width} solid ${theme.colors.border}`,
                borderRadius: theme.borders.radius.sm,
                backgroundColor: theme.colors.bg,
                color: theme.colors.textDark,
                fontSize: theme.typography.fontSize.base,
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: theme.spacing['2xl'] }}>
          <label style={{
            display: 'block',
            marginBottom: theme.spacing.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.textSecondary,
          }}>
            File Type
          </label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as any)}
            disabled={isUploading}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              border: `${theme.borders.width} solid ${theme.colors.border}`,
              borderRadius: theme.borders.radius.sm,
              backgroundColor: theme.colors.bg,
              color: theme.colors.textDark,
              fontSize: theme.typography.fontSize.base,
              cursor: isUploading ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="log">Log file</option>
            <option value="trajectory">Trajectory</option>
            <option value="document">Document</option>
            <option value="image">Image</option>
            <option value="other">Other</option>
          </select>
        </div>

        {uploadError && (
          <div style={{
            marginBottom: theme.spacing.xl,
            padding: theme.spacing.md,
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: theme.borders.radius.sm,
            color: theme.colors.danger,
            fontSize: theme.typography.fontSize.sm,
          }}>
            {uploadError}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: theme.spacing.md,
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleCancel}
            disabled={isUploading}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              border: `${theme.borders.width} solid ${theme.colors.border}`,
              borderRadius: theme.borders.radius.sm,
              backgroundColor: theme.colors.bg,
              color: theme.colors.textDark,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              border: 'none',
              borderRadius: theme.borders.radius.sm,
              backgroundColor: (!selectedFile || isUploading) ? theme.colors.muted : theme.colors.primary,
              color: theme.colors.bg,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: (!selectedFile || isUploading) ? 'not-allowed' : 'pointer',
              opacity: (!selectedFile || isUploading) ? 0.6 : 1,
            }}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
};
