import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { theme } from '@/theme'

interface JsonEditorProps {
  value: object
  onChange?: (value: object) => void
  readOnly?: boolean
  height?: string
  label?: string
}

export function JsonEditor({ value, onChange, readOnly = false, height = '260px', label }: JsonEditorProps) {
  const [error, setError] = useState<string | null>(null)

  const handleChange = (raw: string | undefined) => {
    if (!raw || readOnly) return
    try {
      const parsed = JSON.parse(raw)
      setError(null)
      onChange?.(parsed)
    } catch {
      setError('Invalid JSON')
    }
  }

  return (    <div>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: theme.spacing.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
        }}>
          {label}
        </label>
      )}
      <div style={{
        border: `${theme.borders.width} solid ${error ? theme.colors.danger : theme.colors.border}`,
        borderRadius: theme.borders.radius.sm,
        overflow: 'hidden',
      }}>
        <Editor
          height={height}
          language="json"
          defaultValue={JSON.stringify(value, null, 2)}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            readOnly,
            scrollBeyondLastLine: false,
            lineNumbers: 'off',
            folding: false,
            wordWrap: 'off',
            colorDecorators: true,
          }}
          theme="light"
        />
      </div>
      {error && (
        <div style={{
          marginTop: theme.spacing.xs,
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.danger,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
