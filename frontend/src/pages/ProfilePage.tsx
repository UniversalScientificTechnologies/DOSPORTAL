import { useState, useEffect } from 'react'
import { PageLayout } from '../components/PageLayout'
import { DetectorCard } from '../components/DetectorCard'
import { ProfileField } from '../components/ProfileField'
import { Section } from '../components/Section'
import { CardGrid } from '../components/CardGrid'
import { EmptyState } from '../components/EmptyState'
import { theme } from '../theme'
import profileBg from '../assets/img/SPACEDOS01.jpg'

interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

interface Organization {
  id: string
  name: string
  user_type: string
  data_policy: string
}

interface Detector {
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

export const ProfilePage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string
  originBase: string
  isAuthed: boolean
  getAuthHeader: () => { Authorization?: string }
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [detectors, setDetectors] = useState<Detector[]>([])
  const [measurements, setMeasurements] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch user profile and related data
  useEffect(() => {
    if (!isAuthed) return

    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileRes = await fetch(`${apiBase}/user/profile/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        })
        if (!profileRes.ok) throw new Error(`Profile HTTP ${profileRes.status}`)
        const profileData = await profileRes.json()
        setProfile(profileData)

        // Fetch organizations
        const orgsRes = await fetch(`${apiBase}/user/organizations/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        })
        if (orgsRes.ok) {
          const orgsData = await orgsRes.json()
          setOrganizations(orgsData)
        }

        // Fetch detectors
        const detectorsRes = await fetch(`${apiBase}/detector/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        })
        if (detectorsRes.ok) {
          const detectorsData = await detectorsRes.json()
          setDetectors(detectorsData)
        }

        // Fetch measurements count
        const measurementsRes = await fetch(`${apiBase}/measurement/`, {
          method: 'GET',
          credentials: 'include',
        })
        if (measurementsRes.ok) {
          const measurementsData = await measurementsRes.json()
          setMeasurements(Array.isArray(measurementsData) ? measurementsData.length : 0)
        }
      } catch (e: any) {
        setError(`Failed to load profile: ${e.message}`)
      }
    }

    fetchData()
  }, [apiBase, isAuthed])

  const handleSaveField = async (field: 'email' | 'first_name' | 'last_name', value: string) => {
    setIsSaving(true)
    setError(null)
    setSuccessMsg(null)

    // Validate email if updating email field
    if (field === 'email' && value && value.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        setError('Please enter a valid email address.')
        setIsSaving(false)
        throw new Error('Invalid email')
      }
    }

    try {
      const res = await fetch(`${apiBase}/user/profile/`, {
        method: 'PUT',
        
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          [field]: value,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || `HTTP ${res.status}`)
      }

      const updated = await res.json()
      setProfile(updated)
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (e: any) {
      if (e.message !== 'Invalid email') {
        setError(`Failed to update profile: ${e.message}`)
      }
      throw e
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAuthed) {
    return (
      <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${profileBg})`}>
        <div className="panel">
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
            Login required to view profile.
          </div>
        </div>
      </PageLayout>
    )
  }

  if (!profile) {
    return (
      <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${profileBg})`}>
        <div className="panel">
          <div style={{ padding: theme.spacing['3xl'] }}>Loading profile...</div>
        </div>
      </PageLayout>
    )
  }

  const ownedOrgs = organizations.filter((o) => o.user_type === 'OW')
  const adminOrgs = organizations.filter((o) => o.user_type === 'AD')
  const memberOrgs = organizations.filter((o) => o.user_type === 'ME')

  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${profileBg})`}>
      {/* Fixed position success message */}
      {successMsg && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            backgroundColor: theme.colors.successBg,
            color: theme.colors.successText,
            padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
            borderRadius: theme.borders.radius.sm,
            border: `${theme.borders.width} solid ${theme.colors.successBorder}`,
            boxShadow: theme.shadows.sm,
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      <Section title="👤 User Profile">
        {error && <div className="error" style={{ marginBottom: theme.spacing.lg }}>{error}</div>}

        <div style={{ maxWidth: '600px' }}>
          <ProfileField
            label="Username"
            value={profile.username}
            isReadOnly={true}
          />

          <ProfileField
            label="Email"
            value={profile.email}
            type="email"
            isOptional={true}
            onSave={(value) => handleSaveField('email', value)}
            isSaving={isSaving}
          />

          <ProfileField
            label="First Name"
            value={profile.first_name}
            isOptional={true}
            onSave={(value) => handleSaveField('first_name', value)}
            isSaving={isSaving}
          />

          <ProfileField
            label="Last Name"
            value={profile.last_name}
            isOptional={true}
            onSave={(value) => handleSaveField('last_name', value)}
            isSaving={isSaving}
          />
        </div>
      </Section>

      <section className="panel" style={{ marginTop: theme.spacing.xl }}>
        <header className="panel-header">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>Organizations</h2>
          </div>
          <a 
            href="/organization/create"
            style={{
              display: 'inline-block',
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              background: theme.colors.success,
              color: 'white',
              textDecoration: 'none',
              borderRadius: theme.borders.radius.sm,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              transition: theme.transitions.fast,
            }}
          >
            + Create Organization
          </a>
        </header>

        <div className="panel-body">
          {organizations.length === 0 ? (
            <EmptyState message="You are not a member of any organizations." />
          ) : (
            <div>
              {ownedOrgs.length > 0 && (
                <div style={{ marginBottom: theme.spacing['2xl'] }}>
                  <h4 style={{ color: theme.colors.textDark, marginBottom: theme.spacing.md }}>Owner</h4>
                  {ownedOrgs.map((org) => (
                    <a
                      key={org.id}
                      href={`/organization/${org.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: theme.spacing.lg,
                        backgroundColor: theme.colors.infoBg,
                        border: `${theme.borders.width} solid ${theme.colors.infoBorder}`,
                        borderRadius: theme.borders.radius.sm,
                        marginBottom: theme.spacing.sm,
                        color: theme.colors.textDark,
                        textDecoration: 'none',
                        transition: theme.transitions.fast,
                      }}
                    >
                      <div>
                        <strong>{org.name}</strong> <span style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>({org.data_policy})</span>
                      </div>
                      <span style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium, marginLeft: theme.spacing.lg }}>
                        [Owner]
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {adminOrgs.length > 0 && (
                <div style={{ marginBottom: theme.spacing['2xl'] }}>
                  <h4 style={{ color: theme.colors.textDark, marginBottom: theme.spacing.md }}>Admin</h4>
                  {adminOrgs.map((org) => (
                    <a
                      key={org.id}
                      href={`/organization/${org.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: theme.spacing.lg,
                        backgroundColor: theme.colors.warningBg,
                        border: `${theme.borders.width} solid ${theme.colors.warningBorder}`,
                        borderRadius: theme.borders.radius.sm,
                        marginBottom: theme.spacing.sm,
                        color: theme.colors.textDark,
                        textDecoration: 'none',
                        transition: theme.transitions.fast,
                      }}
                    >
                      <div>
                        <strong>{org.name}</strong> <span style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>(Policy: {org.data_policy})</span>
                      </div>
                      <span style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium, marginLeft: theme.spacing.lg }}>
                        [Admin]
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {memberOrgs.length > 0 && (
                <div>
                  <h4 style={{ color: theme.colors.textDark, marginBottom: theme.spacing.md }}>Member</h4>
                  {memberOrgs.map((org) => (
                    <a
                      key={org.id}
                      href={`/organization/${org.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: theme.spacing.lg,
                        backgroundColor: theme.colors.mutedLighter,
                        border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                        borderRadius: theme.borders.radius.sm,
                        marginBottom: theme.spacing.sm,
                        color: theme.colors.textDark,
                        textDecoration: 'none',
                        transition: theme.transitions.fast,
                      }}
                    >
                      <div>
                        <strong>{org.name}</strong> <span style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>(Policy: {org.data_policy})</span>
                      </div>
                      <span style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium, marginLeft: theme.spacing.lg }}>
                        [Member]
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Detectors Section */}
      <Section title="Detectors Maintained" style={{ marginTop: theme.spacing.xl }}>
        {detectors.length === 0 ? (
          <EmptyState message="No detectors available." />
        ) : (
          <CardGrid>
            {detectors.map((detector) => (
              <DetectorCard key={detector.id} detector={detector} />
            ))}
          </CardGrid>
        )}
      </Section>

      <Section title="Statistics" style={{ marginTop: theme.spacing.xl }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: theme.spacing.lg,
          }}>
            <div style={{
              padding: theme.spacing.lg,
              backgroundColor: '#f0f9ff',
              border: `${theme.borders.width} solid #bfdbfe`,
              borderRadius: theme.borders.radius.sm,
              textAlign: 'center',
              color: theme.colors.textDark,
            }}>
              <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary }}>
                {organizations.length}
              </div>
              <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.muted }}>Organizations</div>
            </div>

            <div style={{
              padding: theme.spacing.lg,
              backgroundColor: '#f0fdf4',
              border: `${theme.borders.width} solid #bbf7d0`,
              borderRadius: theme.borders.radius.sm,
              textAlign: 'center',
              color: theme.colors.textDark,
            }}>
              <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.successLight }}>
                {detectors.length}
              </div>
              <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.muted }}>Detectors</div>
            </div>

            <div style={{
              padding: theme.spacing.lg,
              backgroundColor: '#fef3c7',
              border: `${theme.borders.width} solid #fde047`,
              borderRadius: theme.borders.radius.sm,
              textAlign: 'center',
              color: theme.colors.textDark,
            }}>
              <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.warning }}>
                {measurements}
              </div>
              <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.muted }}>Measurements</div>
            </div>
          </div>
      </Section>
    </PageLayout>
  )
}
