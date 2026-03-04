import { useParams, useNavigate, Link } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { FormField } from '@/shared/components/common/FormField'
import { theme } from '@/theme'
import { useMeasurementsRetrieve } from '@/api/measurements/measurements'
import type { Measurements } from '@/api/model'
import { Button } from '@/shared/components/Button/Button'
import { formatDate } from '@/shared/utils/formatDate'

type MeasurementWithStatus = Measurements & { processing_status?: string }

const PROCESSING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}

const PROCESSING_STATUS_COLORS: Record<string, string> = {
  pending: theme.colors.muted,
  processing: theme.colors.primary,
  completed: theme.colors.success,
  failed: theme.colors.danger,
}

const MEASUREMENT_TYPE_LABELS: Record<string, string> = {
  D: 'Debug',
  S: 'Static',
  M: 'Mobile (ground)',
  C: 'Civil airborne',
  A: 'Special airborne',
}

export const MeasurementStatusPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const measurementQuery = useMeasurementsRetrieve(id!, {
    query: {
      enabled: !!id,
      refetchInterval: (query) => {
        const status = (query.state.data?.data as MeasurementWithStatus)?.processing_status
        return (!status || status === 'pending' || status === 'processing') ? 5000 : false
      },
    },
  })

  const measurement = measurementQuery.data?.data as MeasurementWithStatus | undefined
  const loading = measurementQuery.isLoading && !measurement
  const error = measurementQuery.isError
    ? `Failed to load measurement: ${(measurementQuery.error as Error)?.message ?? 'Unknown error'}`
    : null

  if (loading) {
    return (
      <PageLayout>
        <Section title="Processing Status">
          <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
            Loading measurement...
          </div>
        </Section>
      </PageLayout>
    )
  }

  if (!measurement) {
    return (
      <PageLayout>
        <Section title="Processing Status">
          <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
            Measurement not found
          </div>
        </Section>
      </PageLayout>
    )
  }

  const statusKey = measurement.processing_status ?? 'failed'
  const statusLabel = PROCESSING_STATUS_LABELS[statusKey] ?? statusKey
  const statusColor = PROCESSING_STATUS_COLORS[statusKey] ?? theme.colors.textSecondary
  const isCompleted = measurement.processing_status === 'completed'

  return (
    <PageLayout>
      <Section title="Measurement Processing Status" error={error}>
        
          

          <FormField label="Name" value={measurement.name} isReadOnly />

          <FormField
            label="Type"
            value={MEASUREMENT_TYPE_LABELS[measurement.measurement_type ?? ''] ?? measurement.measurement_type ?? '—'}
            isReadOnly
          />

          <div style={{ marginBottom: theme.spacing['2xl'], paddingBottom: theme.spacing.lg, borderBottom: `${theme.borders.width} solid ${theme.colors.border}` }}>
            <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textSecondary }}>
              Processing Status
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              {measurement.processing_status === 'processing' && (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `3px solid ${theme.colors.border}`,
                  borderTop: `3px solid ${statusColor}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
              )}
              <span style={{ color: statusColor, fontWeight: theme.typography.fontWeight.semibold, fontSize: theme.typography.fontSize.lg }}>
                {statusLabel}
              </span>
            </div>
          </div>

          <FormField label="Created" value={formatDate(measurement.time_created)} isReadOnly />

          {measurement.author && (
            <div style={{ marginBottom: theme.spacing['2xl'], paddingBottom: theme.spacing.lg, borderBottom: `${theme.borders.width} solid ${theme.colors.border}` }}>
              <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textSecondary }}>
                Author
              </label>
              <Link to={`/user/${measurement.author.id}`} style={{ color: theme.colors.primary, textDecoration: 'none' }}>
                @{measurement.author.username}
              </Link>
            </div>
          )}

          <FormField label="Owner" value={measurement.owner?.name ?? '—'} isReadOnly />

        <div style={{ marginTop: theme.spacing.xl, display: 'flex', gap: theme.spacing.md, maxWidth: '600px' }}>
          <Button
            variant="outline"
            onClick={() => navigate('/measurements')}
            title="Return to measurements list"
          >
            Close
          </Button>
          <Button
            onClick={() => navigate(`/measurement/${id}`)}
            disabled={!isCompleted}
            title={isCompleted ? 'View the measurement' : "Measurement must be completed to view"}
          >
            View Measurement
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/measurement/create')}
            title="Create another measurement"
          >
            Create Another
          </Button>
        </div>
      </Section>
    </PageLayout>
  )
}
