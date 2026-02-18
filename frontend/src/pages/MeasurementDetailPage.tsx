import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { Section } from '../components/Section'
import { EmptyState } from '../components/EmptyState'
import { FormField } from '../components/FormField'
import { theme } from '../theme'
import type { Measurement } from '../types'
import ReactMarkdown from 'react-markdown'

const MEASUREMENT_TYPE_LABELS: Record<string, string> = {
  D: 'Debug measurement',
  S: 'Static measurement',
  M: 'Mobile measurement (ground)',
  C: 'Civil airborne measurement',
  A: 'Special airborne measurement',
}

export const MeasurementDetailPage = ({
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
  const [measurement, setMeasurement] = useState<Measurement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthed || !id) {
      setLoading(false)
      return
    }

    const fetchMeasurement = async () => {
      try {
        const res = await fetch(`${apiBase}/measurement/${id}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        })
        
        if (res.status === 404) {
          setError('Measurement not found')
          setLoading(false)
          return
        }
        
        if (res.status === 403) {
          setError('You do not have permission to view this measurement')
          setLoading(false)
          return
        }
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data = await res.json()
        setMeasurement(data)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        setError(`Failed to load measurement: ${message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchMeasurement()
  }, [apiBase, isAuthed, getAuthHeader, id])

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

  if (!isAuthed) {
    return (
      <PageLayout>
        <div className="panel">
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
            Login required to view measurement details.
          </div>
        </div>
      </PageLayout>
    )
  }

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
        <Section title="Measurement Detail">
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
            onClick={() => navigate('/measurements')}
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
            ← Back to Measurements
          </button>
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
      <Section title={measurement.name}>
        <div style={{ marginBottom: theme.spacing.xl }}>
          <Link
            to="/measurements"
            style={{
              color: theme.colors.muted,
              textDecoration: 'none',
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            ← Back to Measurements
          </Link>
        </div>

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
              value={MEASUREMENT_TYPE_LABELS[measurement.measurement_type] || measurement.measurement_type}
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
                Flight Information
              </h3>
              
              <dl style={{ margin: 0 }}>
                <dt style={{
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.xs,
                }}>
                  Flight Number
                </dt>
                <dd style={{
                  marginLeft: 0,
                  marginBottom: theme.spacing.lg,
                  color: theme.colors.textDark,
                }}>
                  {measurement.flight.flight_number}
                </dd>

                {measurement.flight.departure_time && (
                  <>
                    <dt style={{
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.textSecondary,
                      marginBottom: theme.spacing.xs,
                    }}>
                      Departure Time
                    </dt>
                    <dd style={{
                      marginLeft: 0,
                      marginBottom: theme.spacing.lg,
                      color: theme.colors.textDark,
                    }}>
                      {formatDate(measurement.flight.departure_time)}
                    </dd>
                  </>
                )}

                <dt style={{
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.xs,
                }}>
                  Route
                </dt>
                <dd style={{
                  marginLeft: 0,
                  color: theme.colors.textDark,
                }}>
                  <Link
                    to={`/airport/${measurement.flight.takeoff.id}`}
                    style={{
                      color: theme.colors.primary,
                      textDecoration: 'none',
                    }}
                    title={`${measurement.flight.takeoff.name} (${measurement.flight.takeoff.code_iata}${measurement.flight.takeoff.code_icao ? ' / ' + measurement.flight.takeoff.code_icao : ''}) - ${measurement.flight.takeoff.municipality || 'Unknown location'}`}
                  >
                    {measurement.flight.takeoff.code_iata || measurement.flight.takeoff.name}
                  </Link>
                  {' → '}
                  <Link
                    to={`/airport/${measurement.flight.land.id}`}
                    style={{
                      color: theme.colors.primary,
                      textDecoration: 'none',
                    }}
                    title={`${measurement.flight.land.name} (${measurement.flight.land.code_iata}${measurement.flight.land.code_icao ? ' / ' + measurement.flight.land.code_icao : ''}) - ${measurement.flight.land.municipality || 'Unknown location'}`}
                  >
                    {measurement.flight.land.code_iata || measurement.flight.land.name}
                  </Link>
                </dd>
              </dl>
            </div>
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
                {formatDate(measurement.time_start)}
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
                {formatDate(measurement.time_end)}
              </dd>
            </dl>
          </div>
        </div>
      </Section>
    </PageLayout>
  )
}
