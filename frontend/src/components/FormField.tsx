import { useState } from 'react'
import { theme } from '../theme'

interface FormFieldProps {
  label: string;
  value: string;
  isOptional?: boolean;
  isReadOnly?: boolean;
  type?: 'text' | 'email' | 'select' | 'textarea' | 'url';
  onSave?: (value: string) => Promise<void>;
  isSaving?: boolean;
  isEditing?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  options?: { value: string; label: string }[];
}

export const FormField = ({
  label,
  value,
  isOptional = false,
  isReadOnly = false,
  type = 'text',
  onSave,
  isSaving = false,
  onEdit,
  onCancel,
  options,
}: FormFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const handleCancel = () => {
    setIsEditing(false);
    setEditedValue(value);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(editedValue);
      setIsEditing(false);
    }
  };

  // Update editedValue when value prop changes
  if (!isEditing && editedValue !== value) {
    setEditedValue(value);
  }

  return (
    <div style={{ marginBottom: theme.spacing['2xl'], paddingBottom: theme.spacing.lg, borderBottom: `${theme.borders.width} solid ${theme.colors.border}` }}>
      <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textSecondary }}>
        {label} {!isEditing && isOptional && <span style={{ color: theme.colors.mutedLight }}>(optional)</span>}
      </label>
      {isEditing ? (
        <div>
          {type === 'textarea' ? (
            <textarea
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                border: `${theme.borders.width} solid ${theme.colors.primaryLight}`,
                borderRadius: theme.borders.radius.sm,
                marginBottom: theme.spacing.md,
                color: theme.colors.textDark,
                backgroundColor: theme.colors.bg,
                minHeight: 80,
              }}
            />
          ) : type === 'select' && options ? (
            <select
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                border: `${theme.borders.width} solid ${theme.colors.primaryLight}`,
                borderRadius: theme.borders.radius.sm,
                marginBottom: theme.spacing.md,
                color: theme.colors.textDark,
                backgroundColor: theme.colors.bg,
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                border: `${theme.borders.width} solid ${theme.colors.primaryLight}`,
                borderRadius: theme.borders.radius.sm,
                marginBottom: theme.spacing.md,
                color: theme.colors.textDark,
                backgroundColor: theme.colors.bg,
              }}
            />
          )}
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <button
              onClick={handleCancel}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                borderRadius: theme.borders.radius.sm,
                backgroundColor: theme.colors.bg,
                cursor: 'pointer',
                color: theme.colors.textDark,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                border: 'none',
                borderRadius: theme.borders.radius.sm,
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: value ? theme.colors.textDark : theme.colors.muted }}>
            {type === 'select' && options
              ? (options.find((opt) => opt.value === value)?.label || value || '(not provided)')
              : value || '(not provided)'}
          </span>
          {!isReadOnly && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                borderRadius: theme.borders.radius.sm,
                backgroundColor: theme.colors.bg,
                cursor: 'pointer',
                color: theme.colors.textDark,
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
