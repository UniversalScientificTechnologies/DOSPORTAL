import { useState } from 'react'

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
    <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
        {label} {!isEditing && isOptional && <span style={{ color: '#9ca3af' }}>(optional)</span>}
      </label>
      {isEditing ? (
        <div>
          <input
            type={type}
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              marginBottom: '0.75rem',
              color: '#1f2937',
              backgroundColor: '#ffffff',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#f3f4f6',
                cursor: 'pointer',
                color: '#1f2937',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#0d6efd',
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
          <span style={{ color: value ? '#1f2937' : '#9ca3af' }}>
            {value || '(not provided)'}
          </span>
          {!isReadOnly && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                color: '#1f2937',
                fontSize: '0.875rem',
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
