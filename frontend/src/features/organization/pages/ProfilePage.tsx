import { useState } from 'react'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { DetectorCard } from '@/components/DetectorCard'
import { FormField } from '@/shared/components/common/FormField'
import { Section } from '@/shared/components/Layout/Section'
import { CardGrid } from '@/components/CardGrid'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { theme } from '@/theme'
import profileBg from '@/assets/img/SPACEDOS01.jpg'
import {
  useUserProfileRetrieve,
  useUserProfileUpdate,
  useUserOrganizationsList,
  getUserProfileRetrieveQueryKey,
} from '@/api/authentication/authentication'
import { useDetectorsList } from '@/api/detectors/detectors'
import { useMeasurementsList } from '@/api/measurements/measurements'
import { Button } from '@/shared/components/Button/Button'
import { SuccessToast } from '@/shared/components/common/SuccessToast'

import type { UserProfile, OrganizationUser } from '@/api/model'

export const ProfilePage = () => {
  const queryClient = useQueryClient()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const profileQuery = useUserProfileRetrieve()
  const orgsQuery = useUserOrganizationsList()
  const detectorsQuery = useDetectorsList()
  const measurementsQuery = useMeasurementsList()
  const updateProfileMutation = useUserProfileUpdate()

  const profile = profileQuery.data?.data
  const organizations: OrganizationUser[] = orgsQuery.data?.data ?? []
  const detectors = detectorsQuery.data?.data?.results ?? []
  const measurementsCount = measurementsQuery.data?.data?.count ?? 0

  const handleSaveField = async (field: keyof Pick<UserProfile, 'email' | 'first_name' | 'last_name'>, value: string) => {
    if (!profile) return
    setIsSaving(true)
    setSaveError(null)
    setSuccessMsg(null)

    if (field === 'email' && value && value.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        setSaveError('Please enter a valid email address.')
        setIsSaving(false)
        throw new Error('Invalid email')
      }
    }

    try {
      await updateProfileMutation.mutateAsync({
        data: { username: profile.username, [field]: value },
      })
      await queryClient.invalidateQueries({ queryKey: getUserProfileRetrieveQueryKey() })
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as Record<string, string> | undefined)?.detail ?? err.message
        : err instanceof Error ? err.message : 'Unknown error'
      setSaveError(`Failed to update profile: ${detail}`)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  if (profileQuery.isLoading || !profile) {
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
      <SuccessToast message={successMsg} />

      <Section title="👤 User Profile">
        {saveError && <div className="error" style={{ marginBottom: theme.spacing.lg }}>{saveError}</div>}

        <div style={{ maxWidth: '600px' }}>
          <FormField
            label="Username"
            value={profile.username}
            isReadOnly={true}
          />

          <FormField
            label="Email"
            value={profile.email ?? ''}
            type="email"
            isOptional={true}
            onSave={(value) => handleSaveField('email', value)}
            isSaving={isSaving}
          />

          <FormField
            label="First Name"
            value={profile.first_name ?? ''}
            isOptional={true}
            onSave={(value) => handleSaveField('first_name', value)}
            isSaving={isSaving}
          />

          <FormField
            label="Last Name"
            value={profile.last_name ?? ''}
            isOptional={true}
            onSave={(value) => handleSaveField('last_name', value)}
            isSaving={isSaving}
          />
        </div>
      </Section>

      <Section
        title='Organizations'
        actions={<Button variant='success' size='md' to='/organization/create'>+ Create Organization</Button>}
        style={{ marginTop: theme.spacing.sm }}
      >
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
        </Section>

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
                {measurementsCount}
              </div>
              <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.muted }}>Measurements</div>
            </div>
          </div>
      </Section>
    </PageLayout>
  )
}
