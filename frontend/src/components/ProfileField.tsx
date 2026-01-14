import { useState } from 'react'
import { theme } from '../theme'

interface ProfileFieldProps {
  label: string
  value: string
  isOptional?: boolean
  isReadOnly?: boolean
  type?: 'text' | 'email'
  onSave?: (value: string) => Promise<void>
  isSaving?: boolean
}

export const ProfileField = ({
  label,
  value,
  isOptional = false,
  isReadOnly = false,
  type = 'text',
  onSave,
  isSaving = false,
}: ProfileFieldProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedValue, setEditedValue] = useState(value)

  const handleCancel = () => {
    setIsEditing(false)
    setEditedValue(value)
  }

  const handleSave = async () => {
    if (onSave) {
      await onSave(editedValue)
      setIsEditing(false)
    }
  }

  // Update editedValue when value prop changes
  if (!isEditing && editedValue !== value) {
    setEditedValue(value)
  }

  return (
    <div style={{ marginBottom: theme.spacing['2xl'], paddingBottom: theme.spacing.lg, borderBottom: `${theme.borders.width} solid ${theme.colors.border}` }}>
      <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textSecondary }}>
        {label} {!isEditing && isOptional && <span style={{ color: theme.colors.mutedLight }}>(optional)</span>}
      </label>
      {isEditing ? (
        <div>
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
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <button
              onClick={handleCancel}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                borderRadius: theme.borders.radius.sm,
                backgroundColor: '#f3f4f6',
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
            {value || '(not provided)'}
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
  )
}
