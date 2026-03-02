import { useParams, Link } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { FormField } from '@/shared/components/common/FormField'
import { FlightDashboard } from '@/shared/components/common/FlightDashboard'
import { theme } from '@/theme'
import ReactMarkdown from 'react-markdown'
import { useMeasurementsRetrieve } from '@/api/measurements/measurements'
import { MeasurementCharts } from '@/features/measurements/components/MeasurementCharts'
import { formatDate } from '@/shared/utils/formatDate'

const MEASUREMENT_TYPE_LABELS: Record<string, string> = {
  D: 'Debug measurement',
  S: 'Static measurement',
  M: 'Mobile measurement (ground)',
  C: 'Civil airborne measurement',
  A: 'Special airborne measurement',
}

export const MeasurementDetailPage = () => {
  const { id } = useParams<{ id: string }>()

  const measurementQuery = useMeasurementsRetrieve(id ?? '', { query: { enabled: !!id } })
  const measurement = measurementQuery.data?.data
  const loading = measurementQuery.isLoading
  const error = measurementQuery.isError
    ? `Failed to load measurement: ${(measurementQuery.error as Error).message}`
    : null

  if (loading) {
    return (
      <PageLayout>
        <Section title="Measurement Detail">
          <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
            Loading measurement...
          </div>
        </Section>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <Section title="Measurement Detail" error={error} backLink={{ to: '/measurements', label: 'Back to Measurements' }}>
          {null}
        </Section>
      </PageLayout>
    )
  }

  if (!measurement) {
    return (
      <PageLayout>
        <Section title="Measurement Detail">
          <EmptyState message="Measurement not found" />
        </Section>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Section title={measurement.name} backLink={{ to: '/measurements', label: 'Back to Measurements' }}>

        <div style={{
          display: 'grid',
          gap: theme.spacing.xl,
          gridTemplateColumns: '1fr 1fr',
        }}>
          {/* Basic Information */}
          <div style={{
            gridColumn: '1 / -1',
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.bg,
            border: `${theme.borders.width} solid ${theme.colors.border}`,
            borderRadius: theme.borders.radius.sm,
          }}>
            <h3 style={{
              marginTop: 0,
              marginBottom: theme.spacing.lg,
              color: theme.colors.textDark,
              fontSize: theme.typography.fontSize.lg,
            }}>
              Basic Information
            </h3>
            
            <FormField
              label="Type"
              value={MEASUREMENT_TYPE_LABELS[measurement.measurement_type ?? ''] || measurement.measurement_type || '—'}
              isReadOnly={true}
            />
            
            <FormField
              label="Created"
              value={formatDate(measurement.time_created)}
              isReadOnly={true}
            />
            
            <FormField
              label="Public"
              value={measurement.public ? 'Yes' : 'No'}
              isReadOnly={true}
            />
            
            {measurement.author && (
              <div style={{ marginBottom: theme.spacing['2xl'], paddingBottom: theme.spacing.lg, borderBottom: `${theme.borders.width} solid ${theme.colors.border}` }}>
                <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textSecondary }}>
                  Author
                </label>
                <Link
                  to={`/user/${measurement.author.id}`}
                  style={{
                    color: theme.colors.primary,
                    textDecoration: 'none',
                  }}
                >
                  @{measurement.author.username}
                </Link>
              </div>
            )}
            
            {measurement.owner && (
              <div style={{ marginBottom: theme.spacing['2xl'], paddingBottom: theme.spacing.lg, borderBottom: `${theme.borders.width} solid ${theme.colors.border}` }}>
                <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textSecondary }}>
                  Owner Organization
                </label>
                <Link
                  to={`/organization/${measurement.owner.id}`}
                  style={{
                    color: theme.colors.primary,
                    textDecoration: 'none',
                  }}
                >
                  {measurement.owner.name}
                </Link>
              </div>
            )}
            
            {measurement.base_location_lat !== null && (
              <FormField
                label="Latitude"
                value={`${measurement.base_location_lat}°`}
                isReadOnly={true}
              />
            )}
            
            {measurement.base_location_lon !== null && (
              <FormField
                label="Longitude"
                value={`${measurement.base_location_lon}°`}
                isReadOnly={true}
              />
            )}
            
            {measurement.base_location_alt !== null && (
              <FormField
                label="Altitude"
                value={`${measurement.base_location_alt} m`}
                isReadOnly={true}
              />
            )}
          </div>

          {/* Description */}
          {measurement.description && (
            <div style={{
              gridColumn: '1 / -1',
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.bg,
              border: `${theme.borders.width} solid ${theme.colors.border}`,
              borderRadius: theme.borders.radius.sm,
            }}>
              <h3 style={{
                marginTop: 0,
                marginBottom: theme.spacing.lg,
                color: theme.colors.textDark,
                fontSize: theme.typography.fontSize.lg,
              }}>
                Description
              </h3>
              <div className="text" style={{ marginTop: theme.spacing.md }}>
                <ReactMarkdown>{measurement.description}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Flight Information */}
          {measurement.flight && (
            <FlightDashboard flight={measurement.flight} formatDate={formatDate} />
          )}

          {/* Time Range */}
          <div style={{
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.bg,
            border: `${theme.borders.width} solid ${theme.colors.border}`,
            borderRadius: theme.borders.radius.sm,
          }}>
            <h3 style={{
              marginTop: 0,
              marginBottom: theme.spacing.lg,
              color: theme.colors.textDark,
              fontSize: theme.typography.fontSize.lg,
            }}>
              Time Range
            </h3>
            
            <dl style={{ margin: 0 }}>
              <dt style={{
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xs,
              }}>
                Start Time
              </dt>
              <dd style={{
                marginLeft: 0,
                marginBottom: theme.spacing.lg,
                color: theme.colors.textDark,
              }}>
                {formatDate(measurement.time_start ?? undefined)}
              </dd>

              <dt style={{
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xs,
              }}>
                End Time
              </dt>
              <dd style={{
                marginLeft: 0,
                color: theme.colors.textDark,
              }}>
                {formatDate(measurement.time_end ?? undefined)}
              </dd>
            </dl>
          </div>

          {/* Charts - only show when measurement data is available */}
          {measurement && (
            <div style={{ gridColumn: '1 / -1', marginTop: theme.spacing.sm }}>
              <MeasurementCharts measurementId={id!} />
            </div>
          )}
        </div>
      </Section>
    </PageLayout>
  )
}
