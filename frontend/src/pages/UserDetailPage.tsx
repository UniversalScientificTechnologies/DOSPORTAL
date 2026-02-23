import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { Section } from '../components/Section'
import { EmptyState } from '../components/EmptyState'
import { FormField } from '../components/FormField'
import { theme } from '../theme'
import type { User } from '../types'

export const UserDetailPage = ({
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthed || !id) {
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        console.log("id: "+id)
        const res = await fetch(`${apiBase}/user/${id}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        })
        
        if (res.status === 404) {
          setError('User not found')
          setLoading(false)
          return
        }
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data = await res.json()
        setUser(data)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        setError(`Failed to load user: ${message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [apiBase, isAuthed, getAuthHeader, id])

  if (!isAuthed) {
    return (
      <PageLayout>
        <div className="panel">
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
            Login required to view user details.
          </div>
        </div>
      </PageLayout>
    )
  }

  if (loading) {
    return (
      <PageLayout>
        <Section title="User Profile">
          <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
            Loading user...
          </div>
        </Section>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <Section title="User Profile">
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
            onClick={() => navigate(-1)}
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
            ← Go Back
          </button>
        </Section>
      </PageLayout>
    )
  }

  if (!user) {
    return (
      <PageLayout>
        <Section title="User Profile">
          <EmptyState message="User not found" />
        </Section>
      </PageLayout>
    )
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username

  return (
    <PageLayout>
      <Section title={`@${user.username}`}>
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
            User Information
          </h3>
          
          <FormField
            label="Username"
            value={user.username}
            isReadOnly={true}
          />
          
          {(user.first_name || user.last_name) && (
            <FormField
              label="Full Name"
              value={displayName}
              isReadOnly={true}
            />
          )}
        </div>
      </Section>
    </PageLayout>
  )
}
