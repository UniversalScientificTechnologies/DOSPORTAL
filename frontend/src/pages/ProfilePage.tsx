import { useState, useEffect } from 'react'
import { PageLayout } from '../components/PageLayout'
import { DetectorCard } from '../components/DetectorCard'
import { ProfileField } from '../components/ProfileField'
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

interface LogbookEntry {
  id: string
  detector: {
    name: string
  }
}

export const ProfilePage = ({
  apiBase,
  originBase,
  isAuthed,
}: {
  apiBase: string
  originBase: string
  isAuthed: boolean
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
          credentials: 'include',
        })
        if (!profileRes.ok) throw new Error(`Profile HTTP ${profileRes.status}`)
        const profileData = await profileRes.json()
        setProfile(profileData)

        // Fetch organizations
        const orgsRes = await fetch(`${apiBase}/user/organizations/`, {
          method: 'GET',
          credentials: 'include',
        })
        if (orgsRes.ok) {
          const orgsData = await orgsRes.json()
          setOrganizations(orgsData)
        }

        // Fetch detectors
        const detectorsRes = await fetch(`${apiBase}/detector/`, {
          method: 'GET',
          credentials: 'include',
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
      // Get CSRF token
      const csrftoken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrftoken='))
        ?.split('=')[1] || ''

      const res = await fetch(`${apiBase}/user/profile/`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
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
          <div style={{ color: '#dc3545', padding: '2rem' }}>
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
          <div style={{ padding: '2rem' }}>Loading profile...</div>
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
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid #c3e6cb',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      <section className="panel">
        <header className="panel-header">
          <h2>👤 User Profile</h2>
        </header>

        {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <div className="panel-body" style={{ maxWidth: '600px' }}>
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
      </section>

      {/* Organizations Section */}
      <section className="panel" style={{ marginTop: '1.25rem' }}>
        <header className="panel-header">
          <h3>Organizations</h3>
        </header>
        <div className="panel-body">
          {organizations.length === 0 ? (
            <p className="muted">You are not a member of any organizations.</p>
          ) : (
            <div>
              {ownedOrgs.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#1f2937', marginBottom: '0.75rem' }}>Owner</h4>
                  {ownedOrgs.map((org) => (
                    <div
                      key={org.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        marginBottom: '0.5rem',
                        color: '#1f2937',
                      }}
                    >
                      <strong>{org.name}</strong> <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>({org.data_policy})</span>
                    </div>
                  ))}
                </div>
              )}

              {adminOrgs.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#1f2937', marginBottom: '0.75rem' }}>Admin</h4>
                  {adminOrgs.map((org) => (
                    <div
                      key={org.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#fefce8',
                        border: '1px solid #fde047',
                        borderRadius: '6px',
                        marginBottom: '0.5rem',
                        color: '#1f2937',
                      }}
                    >
                      <strong>{org.name}</strong> <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>(Policy: {org.data_policy})</span>
                    </div>
                  ))}
                </div>
              )}

              {memberOrgs.length > 0 && (
                <div>
                  <h4 style={{ color: '#1f2937', marginBottom: '0.75rem' }}>Member</h4>
                  {memberOrgs.map((org) => (
                    <div
                      key={org.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        marginBottom: '0.5rem',
                        color: '#1f2937',
                      }}
                    >
                      <strong>{org.name}</strong> <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>(Policy: {org.data_policy})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Detectors Section */}
      <section className="panel" style={{ marginTop: '1.25rem' }}>
        <header className="panel-header">
          <h3>Detectors Maintained</h3>
        </header>
        <div className="panel-body">
          {detectors.length === 0 ? (
            <p className="muted">No detectors available.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}>
              {detectors.map((detector) => (
                <DetectorCard key={detector.id} detector={detector} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="panel" style={{ marginTop: '1.25rem' }}>
        <header className="panel-header">
          <h3>Statistics</h3>
        </header>
        <div className="panel-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              textAlign: 'center',
              color: '#1f2937',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0d6efd' }}>
                {organizations.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Organizations</div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              textAlign: 'center',
              color: '#1f2937',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
                {detectors.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Detectors</div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde047',
              borderRadius: '6px',
              textAlign: 'center',
              color: '#1f2937',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {measurements}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Measurements</div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
