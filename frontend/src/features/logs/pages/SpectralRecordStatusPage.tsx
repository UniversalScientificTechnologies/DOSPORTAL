import { useParams, useNavigate, Link } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { FormField } from '@/shared/components/common/FormField'
import { theme } from '@/theme'
import { useSpectralRecordsRetrieve } from '@/api/spectral-records/spectral-records'
import type { SpectralRecord } from '@/api/model'
import { Button } from '@/shared/components/Button/Button'
import { formatDate } from '@/shared/utils/formatDate'

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

export const SpectralRecordStatusPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const recordQuery = useSpectralRecordsRetrieve(id!, {
    query: {
      enabled: !!id,
      refetchInterval: (query) => {
        const status = query.state.data?.data?.processing_status
        return (!status || status === 'pending' || status === 'processing') ? 5000 : false
      },
    },
  })
  const record = recordQuery.data?.data as SpectralRecord | undefined
  const loading = recordQuery.isLoading && !record
  const error = recordQuery.isError
    ? `Failed to load spectral record: ${(recordQuery.error as Error)?.message ?? 'Unknown error'}`
    : null

  const handleClose = () => {
    navigate('/logs')
  }

  const handleShowLog = () => {
    navigate(`/spectral-record/${id}`)
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

  const statusLabel = PROCESSING_STATUS_LABELS[record.processing_status || 'failed'] || record.processing_status
  const statusColor = PROCESSING_STATUS_COLORS[record.processing_status || 'failed'] || theme.colors.textSecondary
  const isCompleted = record.processing_status === 'completed'

  return (
    <PageLayout>
      <Section title="Spectral Record Processing Status" error={error}>
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
            value={record.name ?? '—'}
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
            <div style={{ marginBottom: theme.spacing['2xl'], paddingBottom: theme.spacing.lg, borderBottom: `${theme.borders.width} solid ${theme.colors.border}` }}>
              <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textSecondary }}>
                Author
              </label>
              <Link
                to={`/user/${record.author.id}`}
                style={{ color: theme.colors.primary, textDecoration: 'none' }}
              >
                @{record.author.username}
              </Link>
            </div>
          )}
          
          <FormField
            label="Owner"
            value={record.owner?.name || '—'}
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
          <Button
            variant='outline'
            onClick={handleClose}
            title="Return to logs page. This does not cancel the background processing task."
          >
            Close
          </Button>
          <Button
            onClick={handleShowLog}
            disabled={!isCompleted}
            title={isCompleted ? 'View the processed log' : "Log must have status 'Completed' to view"}
          >
            Show Log
          </Button>
          <Button
            variant='outline'
            onClick={() => navigate('/logs/upload')}
            title="Upload next file"
          >
            Upload Next
          </Button>
        </div>
      </Section>
    </PageLayout>
  )
}
