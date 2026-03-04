import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSelect } from '@/shared/components/common/AppSelect';
import type { SelectOption } from '@/shared/components/common/AppSelect';
import { PageLayout } from '@/shared/components/Layout/PageLayout';
import { FileDropzone } from '@/shared/components/common/FileDropzone';
import { LabeledInput } from '@/shared/components/common/LabeledInput';
import { JsonEditor } from '@/shared/components/common/JsonEditor';
import { theme } from '@/theme';
import { useUserOrganizationsOwnedList } from '@/api/authentication/authentication';
import { useDetectorsList } from '@/api/detectors/detectors';
import { useFilesCreate } from '@/api/files/files';
import { useSpectralRecordsCreate } from '@/api/spectral-records/spectral-records';
import type { FileTypeEnum, FileUploadRequest } from '@/api/model';

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: theme.spacing.sm,
  fontWeight: theme.typography.fontWeight.medium,
  color: theme.colors.textSecondary,
};

export const LogsUploadPage = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<FileTypeEnum>('log');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<SelectOption | null>(null);
  const [selectedDetector, setSelectedDetector] = useState<SelectOption | null>(null);
  const [metadata, setMetadata] = useState<object>({});

  const orgsQuery = useUserOrganizationsOwnedList();
  const orgOptions: SelectOption[] = (orgsQuery.data?.data ?? []).map((o) => ({ value: o.id, label: o.name }));

  const detectorsQuery = useDetectorsList();
  const detectorOptions: SelectOption[] = (detectorsQuery.data?.data?.results ?? []).map((d) => ({
    value: d.id,
    label: `${d.name} (${d.sn})`,
  }));

  const uploadFileMutation = useFilesCreate();
  const createRecordMutation = useSpectralRecordsCreate();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
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
    if (fileType === 'log' && !selectedOwner) {
      setUploadError('Please select an owner organization for log files');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('filename', fileName);
      formData.append('file_type', fileType);
      if (fileType === 'log' && selectedOwner) {
        formData.append('owner', selectedOwner.value);
      }

      const fileResult = await uploadFileMutation.mutateAsync({
        data: formData as unknown as FileUploadRequest,
      });
      const fileData = fileResult.data;

      if (fileType === 'log') {
        const recordResult = await createRecordMutation.mutateAsync({
          data: {
            raw_file: fileData.id,
            name: fileName,
            description,
            metadata,
            ...(selectedOwner?.value ? { owner: selectedOwner.value } : {}),
            ...(selectedDetector?.value ? { detector: selectedDetector.value } : {}),
          },
        });
        const recordData = recordResult.data as unknown as { id: string };
        navigate(`/spectral-record-status/${recordData.id}`);
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

        {fileType === 'log' && (
          <div style={{ marginBottom: theme.spacing.xl }}>
            <JsonEditor
              label="Metadata (optional)"
              value={metadata}
              onChange={setMetadata}
              height="200px"
            />
          </div>
        )}

        {fileType === 'log' && (
          <div style={{ marginBottom: theme.spacing.xl }}>
            <label style={labelStyle}>
              Owner Organization <span style={{ color: theme.colors.danger }}>*</span>
            </label>
            <AppSelect
              options={orgOptions}
              value={selectedOwner}
              onChange={setSelectedOwner}
              isDisabled={isUploading}
              placeholder="— Select organization —"
              isClearable
            />
          </div>
        )}

        {fileType === 'log' && (
          <div style={{ marginBottom: theme.spacing.xl }}>
            <label style={labelStyle}>
              Detector (optional)
            </label>
            <AppSelect
              options={detectorOptions}
              value={selectedDetector}
              onChange={setSelectedDetector}
              isDisabled={isUploading}
              isLoading={detectorsQuery.isLoading}
              placeholder="— None —"
              isClearable
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
            onChange={(e) => setFileType(e.target.value as 'log' | 'trajectory' | 'document' | 'image' | 'other')}
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
