import { useParams, useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { Section } from '../components/Section'
import { theme } from '../theme'
import { useAuthContext } from '../context/AuthContext'

export const AirportDetailPage = () => {
  const { API_BASE: apiBase, getAuthHeader } = useAuthContext()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <PageLayout>
      <Section title="Airport Detail">
        <div style={{ marginBottom: theme.spacing.xl }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: theme.colors.bg,
              color: theme.colors.primary,
              border: `${theme.borders.width} solid ${theme.colors.border}`,
              borderRadius: theme.borders.radius.sm,
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            ← Back
          </button>
        </div>

        <div style={{ padding: theme.spacing['2xl'], color: theme.colors.textSecondary }}>
          <p>Airport ID: <strong>{id}</strong></p>
          <p style={{ marginTop: theme.spacing.xl, color: theme.colors.muted }}>
            Airport detail page coming soon...
          </p>
        </div>
      </Section>
    </PageLayout>
  )
}
