import { Link } from 'react-router-dom'
import { theme } from '@/theme'
import type { Flight } from '@/api/model'

interface FlightDashboardProps {
  flight: Flight
  formatDate?: (dateStr?: string) => string
}

const defaultFormatDate = (dateStr?: string) => {
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

export const FlightDashboard = ({ flight, formatDate = defaultFormatDate }: FlightDashboardProps) => {
  const dtStyle: React.CSSProperties = {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  }
  const ddStyle: React.CSSProperties = {
    marginLeft: 0,
    marginBottom: theme.spacing.lg,
    color: theme.colors.textDark,
  }

  return (
    <div
      style={{
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.bg,
        border: `${theme.borders.width} solid ${theme.colors.border}`,
        borderRadius: theme.borders.radius.sm,
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: theme.spacing.lg,
          color: theme.colors.textDark,
          fontSize: theme.typography.fontSize.lg,
        }}
      >
        Flight Information
      </h3>

      <dl style={{ margin: 0 }}>
        <dt style={dtStyle}>Flight Number</dt>
        <dd style={ddStyle}>{flight.flight_number}</dd>

        {flight.departure_time && (
          <>
            <dt style={dtStyle}>Departure Time</dt>
            <dd style={ddStyle}>{formatDate(flight.departure_time)}</dd>
          </>
        )}

        <dt style={dtStyle}>Route</dt>
        <dd style={{ marginLeft: 0, color: theme.colors.textDark }}>
          <Link
            to={`/airport/${flight.takeoff.id}`}
            style={{ color: theme.colors.primary, textDecoration: 'none' }}
            title={`${flight.takeoff.name} (${flight.takeoff.code_iata}${flight.takeoff.code_icao ? ' / ' + flight.takeoff.code_icao : ''}) - ${flight.takeoff.municipality || 'Unknown location'}`}
          >
            {flight.takeoff.code_iata || flight.takeoff.name}
          </Link>
          {' → '}
          <Link
            to={`/airport/${flight.land.id}`}
            style={{ color: theme.colors.primary, textDecoration: 'none' }}
            title={`${flight.land.name} (${flight.land.code_iata}${flight.land.code_icao ? ' / ' + flight.land.code_icao : ''}) - ${flight.land.municipality || 'Unknown location'}`}
          >
            {flight.land.code_iata || flight.land.name}
          </Link>
        </dd>
      </dl>
    </div>
  )
}
