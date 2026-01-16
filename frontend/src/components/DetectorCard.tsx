import { useNavigate } from 'react-router-dom'
import { theme } from '../theme'

interface DetectorCardProps {
  detector: {
    id: string
    name: string
    sn: string
    type: {
      name: string
      manufacturer: {
        name: string
      }
    }
  }
}

export const DetectorCard = ({ detector }: DetectorCardProps) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/logbook/${detector.id}`)}
      style={{
        padding: theme.spacing['2xl'],
        background: theme.colors.card,
        border: `2px solid ${theme.colors.border}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,110,253,0.15)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <h3 style={{ margin: `0 0 ${theme.spacing.md} 0`, fontSize: theme.typography.fontSize.lg, color: theme.colors.text }}>
        {detector.name}
      </h3>
      <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.muted, marginBottom: theme.spacing.sm }}>
        <div style={{ marginBottom: theme.spacing.xs }}>
          <strong>Type:</strong> {detector.type?.name || 'N/A'}
        </div>
        <div>
          <strong>Serial:</strong> {detector.sn}
        </div>
      </div>
      <div
        style={{
          marginTop: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          borderTop: `${theme.borders.width} solid ${theme.colors.border}`,
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.primary,
          fontWeight: theme.typography.fontWeight.medium,
        }}
      >
        View Logbook →
      </div>
    </div>
  )
}
