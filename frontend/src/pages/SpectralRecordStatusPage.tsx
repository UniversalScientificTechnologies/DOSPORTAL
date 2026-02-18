import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { Section } from '../components/Section'
import { FormField } from '../components/FormField'
import { theme } from '../theme'

type SpectralRecord = {
  id: string
  name: string
  processing_status: string
  created: string
  author: string | null
  owner: string | null
  raw_file_id: string | null
  artifacts_count: number
  description?: string
}

const PROCESSING_STATUS_LABELS: Record<string, string> = {
  'pending': 'Pending',
  'processing': 'Processing',
  'completed': 'Completed',
  'failed': 'Failed',
}

const PROCESSING_STATUS_COLORS: Record<string, string> = {
  'pending': theme.colors.muted,
  'processing': theme.colors.primary,
  'completed': theme.colors.success,
  'failed': theme.colors.danger,
}

export const SpectralRecordStatusPage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string
  isAuthed: boolean
  getAuthHeader: () => { Authorization?: string }
}) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<SpectralRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecord = async () => {
    if (!isAuthed || !id) return

    try {
      const res = await fetch(`${apiBase}/spectral-record/${id}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      })
      
      if (res.status === 404) {
        setError('Spectral record not found')
        setLoading(false)
        return
      }
      
      if (res.status === 403) {
        setError('You do not have permission to view this record')
        setLoading(false)
        return
      }
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      
      const data = await res.json()
      setRecord(data)
      setLoading(false)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setError(`Failed to load spectral record: ${message}`)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecord()

    // Only poll if status is pending or processing
    if (record && (record.processing_status === 'completed' || record.processing_status === 'failed')) {
      return
    }

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchRecord()
    }, 5000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, isAuthed, id, record?.processing_status])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const handleClose = () => {
    navigate('/logs')
  }

  const handleShowLog = () => {
    navigate(`/spectral-record/${id}`)
  }

  if (!isAuthed) {
    return (
      <PageLayout>
        <div className="panel">
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
            Login required to view spectral record status.
          </div>
        </div>
      </PageLayout>
    )
  }

  if (loading && !record) {
    return (
      <PageLayout>
        <Section title="Processing Status">
          <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
            Loading record...
          </div>
        </Section>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <Section title="Processing Status">
          <div style={{
            padding: theme.spacing['2xl'],
            color: theme.colors.danger,
            backgroundColor: theme.colors.successBg,
            borderRadius: theme.borders.radius.sm,
            marginBottom: theme.spacing.xl,
          }}>
            {error}
          </div>
          <button
            onClick={handleClose}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              backgroundColor: theme.colors.primary,
              color: theme.colors.bg,
              border: 'none',
              borderRadius: theme.borders.radius.sm,
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Return to Logs
          </button>
        </Section>
      </PageLayout>
    )
  }

  if (!record) {
    return (
      <PageLayout>
        <Section title="Processing Status">
          <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
            Record not found
          </div>
        </Section>
      </PageLayout>
    )
  }

  const statusLabel = PROCESSING_STATUS_LABELS[record.processing_status] || record.processing_status
  const statusColor = PROCESSING_STATUS_COLORS[record.processing_status] || theme.colors.textSecondary
  const isCompleted = record.processing_status === 'completed'

  return (
    <PageLayout>
      <Section title="Spectral Record Processing Status">
        <div style={{
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.bg,
          border: `${theme.borders.width} solid ${theme.colors.border}`,
          borderRadius: theme.borders.radius.sm,
          maxWidth: '600px',
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: theme.spacing.lg,
            color: theme.colors.textDark,
            fontSize: theme.typography.fontSize.lg,
          }}>
            Record Information
          </h3>
          
          <FormField
            label="Name"
            value={record.name}
            isReadOnly={true}
          />
          
          <div style={{ marginBottom: theme.spacing['2xl'], paddingBottom: theme.spacing.lg, borderBottom: `${theme.borders.width} solid ${theme.colors.border}` }}>
            <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textSecondary }}>
              Processing Status
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}>
              {record.processing_status === 'processing' && (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `3px solid ${theme.colors.border}`,
                  borderTop: `3px solid ${statusColor}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}
              <span style={{
                color: statusColor,
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.lg,
              }}>
                {statusLabel}
              </span>
            </div>
          </div>
          
          <FormField
            label="Created"
            value={formatDate(record.created)}
            isReadOnly={true}
          />
          
          {record.author && (
            <FormField
              label="Author"
              value={`@${record.author}`}
              isReadOnly={true}
            />
          )}
          
          <FormField
            label="Owner"
            value={record.owner || '—'}
            isReadOnly={true}
          />
          
          <FormField
            label="Artifacts"
            value={String(record.artifacts_count)}
            isReadOnly={true}
          />
        </div>

        <div style={{ 
          marginTop: theme.spacing.xl,
          display: 'flex', 
          gap: theme.spacing.md,
          maxWidth: '600px',
        }}>
          <button
            onClick={handleClose}
            title="Return to logs page. This does not cancel the background processing task."
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              border: `${theme.borders.width} solid ${theme.colors.border}`,
              borderRadius: theme.borders.radius.sm,
              backgroundColor: theme.colors.bg,
              color: theme.colors.textDark,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            onClick={handleShowLog}
            disabled={!isCompleted}
            title={isCompleted ? "View the processed log" : "Log must have status 'Completed' to view"}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              border: 'none',
              borderRadius: theme.borders.radius.sm,
              backgroundColor: isCompleted ? theme.colors.primary : theme.colors.muted,
              color: theme.colors.bg,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: isCompleted ? 'pointer' : 'not-allowed',
              opacity: isCompleted ? 1 : 0.6,
            }}
          >
            Show Log
          </button>
        </div>
      </Section>
    </PageLayout>
  )
}
