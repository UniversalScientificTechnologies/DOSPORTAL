import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { PageLayout } from '@/shared/components/Layout/PageLayout';
import { Section } from '@/shared/components/Layout/Section';
import { theme } from '@/theme';
import { useAuthContext } from '@/features/auth/hooks/useAuthContext';
import {
  useInvitesRetrieve,
  useInvitesAcceptCreate,
} from '@/api/organizations/organizations';
import { Button } from '@/shared/components/Button/Button';
import { InfoRow } from '@/features/organization/components/InfoRow';

export const InviteAcceptPage = () => {
  const { isAuthed, isLoading } = useAuthContext();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const inviteQuery = useInvitesRetrieve(token ?? '');
  const inviteInfo = inviteQuery.data?.data as unknown as { organization?: { id: string; name: string; description?: string }; user_type?: string; expires_at?: string; is_active?: boolean } | undefined;
  const inviteError = inviteQuery.isError
    ? axios.isAxiosError(inviteQuery.error)
      ? (inviteQuery.error.response?.data as Record<string, string> | undefined)?.detail || 'Invalid invite'
      : 'Invalid invite'
    : null;

  const acceptMutation = useInvitesAcceptCreate();
  const acceptError = acceptMutation.isError
    ? axios.isAxiosError(acceptMutation.error)
      ? (acceptMutation.error.response?.data as Record<string, string> | undefined)?.detail || 'Failed to join organization'
      : 'Failed to join organization'
    : null;
  const successMsg = acceptMutation.isSuccess
    ? (acceptMutation.data?.data as Record<string, unknown> | undefined)?.detail as string | undefined
      ?? 'You have joined the organization!'
    : null;

  useEffect(() => {
    if (isLoading) return; // Wait until auth state is known
    if (!isAuthed) {
      navigate(`/login?next=/invite/${token}`); // not handled copletely (next not working)
      return;
    }
  }, [isAuthed, isLoading, token, navigate]);

  const handleAccept = () => {
    if (!token) return;
    acceptMutation.mutate({ token });
  };

  if (isLoading || inviteQuery.isLoading) {
    return (
      <PageLayout>
        <Section title="Organization Invite" maxWidth={500} isLoading />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Section
        title="Organization Invite"
        maxWidth={500}
        error={inviteError}
      >
        {inviteInfo && (
          <div style={{ marginBottom: theme.spacing.lg }}>
            <InfoRow label="Organization">
              {inviteInfo.organization?.name}
              {inviteInfo.organization?.id && (
                <Link
                  to={`/organization/${inviteInfo.organization.id}`}
                  style={{ marginLeft: 8, fontSize: '0.95em', color: theme.colors.primary, textDecoration: 'underline' }}
                >
                  (View details)
                </Link>
              )}
            </InfoRow>
            <InfoRow label="Description">{inviteInfo.organization?.description || 'No description'}</InfoRow>
            <InfoRow label="Invite type">{inviteInfo.user_type === 'AD' ? 'Admin' : 'Member'}</InfoRow>
            <InfoRow label="Expires at">{inviteInfo.expires_at ? new Date(inviteInfo.expires_at).toLocaleString() : 'N/A'}</InfoRow>
            <InfoRow label="Status">{inviteInfo.is_active ? 'Active invitation' : 'Inactive/Expired'}</InfoRow>
          </div>
        )}
        
        {acceptMutation.isSuccess ? (
          <>
            <div style={{ color: theme.colors.success, marginBottom: theme.spacing.lg }}>{successMsg}</div>
            {inviteInfo?.organization?.id && (
              <Button
                variant='primary'
                onClick={() => navigate(`/organization/${inviteInfo?.organization?.id}`)}
                style={{marginTop: theme.spacing['2xl']}}>
                Go to organization
              </Button>
            )}
          </>
        ) : (
          <>
            <div style={{ marginBottom: theme.spacing.lg }}>
              Click the button below to join the organization.
            </div>
            {acceptError && <div style={{ color: theme.colors.danger, marginBottom: theme.spacing.md }}>{acceptError}</div>}

            <Button
              variant='success'
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
              style={{ marginTop: theme.spacing['2xl']}}>
                {acceptMutation.isPending ? 'Joining...' : 'Join organization'}
              </Button>
          </>
        )}
      </Section>
    </PageLayout>
  );
};
