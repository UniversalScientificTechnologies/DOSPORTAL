import { useState, useCallback } from 'react';
import { theme } from '../theme';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export const FileDropzone = ({
  onFileSelect,
  accept = '.txt,.log,.csv',
  maxSizeMB = 500,
  disabled = false,
}: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    const fileName = file.name.toLowerCase();
    const acceptedExtensions = accept.split(',').map(ext => ext.trim());
    const hasValidExtension = acceptedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return `Invalid file type. Accepted: ${accept}`;
    }

    return null;
  }, [accept, maxSizeMB]);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? theme.colors.primary : theme.colors.border}`,
          borderRadius: theme.borders.radius.md,
          padding: theme.spacing['3xl'],
          textAlign: 'center',
          backgroundColor: isDragging ? theme.colors.infoBorder : theme.colors.bg,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
        }}
        onClick={() => {
          if (!disabled) {
            document.getElementById('file-input')?.click();
          }
        }}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        
        <div style={{ fontSize: theme.typography.fontSize['3xl'], marginBottom: theme.spacing.md, color: theme.colors.primary }}>
          📁
        </div>
        
        <p style={{ 
          fontSize: theme.typography.fontSize.lg, 
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.textDark,
          marginBottom: theme.spacing.sm,
        }}>
          {isDragging ? 'Drop file here' : 'Drag & drop file here'}
        </p>
        
        <p style={{ 
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.md,
        }}>
          or click to browse
        </p>
        
        <p style={{ 
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.muted,
        }}>
          Accepted formats: {accept} • Max size: {maxSizeMB}MB
        </p>
      </div>

      {error && (
        <div style={{
          marginTop: theme.spacing.md,
          padding: theme.spacing.md,
          backgroundColor: '#fee',
          border: `1px solid #fcc`,
          borderRadius: theme.borders.radius.sm,
          color: '#c00',
          fontSize: theme.typography.fontSize.sm,
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
