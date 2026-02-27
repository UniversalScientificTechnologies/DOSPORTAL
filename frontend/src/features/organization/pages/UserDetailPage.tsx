import { useParams } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { FormField } from '@/shared/components/common/FormField'
import { theme } from '@/theme'
import { useUserRetrieve } from '@/api/users/users'
import type { UserSummary } from '@/api/model'

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>()

  const userQuery = useUserRetrieve(Number(id), { query: { enabled: !!id } })
  const user = userQuery.data?.data as UserSummary | undefined
  const loading = userQuery.isLoading
  const error = userQuery.isError
    ? `Failed to load user: ${(userQuery.error as any)?.message ?? 'Unknown error'}`
    : null

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
      <Section title='User Information' error={error}>
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
      </Section>
    </PageLayout>
  )
}
