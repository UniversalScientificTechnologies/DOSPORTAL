import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { theme } from '../theme';
import { useAuthContext } from '../context/AuthContext';

export const InviteAcceptPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { API_BASE, isAuthed, isLoading, getAuthHeader } = useAuthContext();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  
  // Fetch invite details on mount
  useEffect(() => {
    if (!token) return;
    setInviteLoading(true);
    fetch(`${API_BASE}/invites/${token}/`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Invalid invite');
        setInviteInfo(data);
        setInviteLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setInviteLoading(false);
      });
  }, [API_BASE, token]);

  useEffect(() => {
    if (isLoading) return; // Wait until auth state is known
    if (!isAuthed) {
      navigate(`/login?next=/invite/${token}`); // not handled copletely (next not working)
      return;
    }
  }, [isAuthed, isLoading, token, navigate]);

  const handleAccept = async () => {
    if (!token) return;
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/invites/${token}/accept/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to join organization');
      setStatus('success');
      setSuccessMsg('You have joined the organization!');
    } catch (e: any) {
      setStatus('error');
      setError(e.message);
    }
  };

  if (isLoading || inviteLoading) {
    return (
      <PageLayout>
        <div className="panel" style={{ maxWidth: 500, margin: '40px auto', padding: theme.spacing['2xl'], textAlign: 'center' }}>
          <h2>Organization Invite</h2>
          <div>Loading...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="panel" style={{ maxWidth: 500, margin: '40px auto', padding: theme.spacing['2xl'] }}>
        <h2>Organization Invite</h2>
        {inviteInfo && (
          <div style={{ marginBottom: theme.spacing.lg }}>
            <div><b>Organization:</b> {inviteInfo.organization?.name} {inviteInfo.organization?.id && (
              <a
                href={`/organization/${inviteInfo.organization.id}`}
                style={{ marginLeft: 8, fontSize: '0.95em', color: theme.colors.primary || '#007bff', textDecoration: 'underline' }}
                target="_blank" rel="noopener noreferrer"
              >
                (View details)
              </a>
            )}</div>
            <div><b>Description:</b> {inviteInfo.organization?.description || 'No description'}</div>
            <div><b>Invite type:</b> {inviteInfo.user_type === 'AD' ? 'Admin' : 'Member'}</div>
            <div><b>Expires at:</b> {inviteInfo.expires_at ? new Date(inviteInfo.expires_at).toLocaleString() : 'N/A'}</div>
            <div><b>Status:</b> {inviteInfo.is_active ? 'Active invitation' : 'Inactive/Expired'}</div>
          </div>
        )}
        {status === 'success' ? (
          <>
            <div style={{ color: theme.colors.success, marginBottom: theme.spacing.lg }}>{successMsg}</div>
            {inviteInfo?.organization?.id && (
              <button
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  background: theme.colors.primary || '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borders.radius.sm,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  marginTop: theme.spacing.lg,
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/organization/${inviteInfo.organization.id}`)}
              >
                Go to organization
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ marginBottom: theme.spacing.lg }}>
              Click the button below to join the organization.
            </div>
            {error && <div style={{ color: theme.colors.danger, marginBottom: theme.spacing.md }}>{error}</div>}
            <button
              onClick={handleAccept}
              disabled={status === 'loading'}
              style={{
                padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                background: theme.colors.success,
                color: 'white',
                border: 'none',
                borderRadius: theme.borders.radius.sm,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
              }}
            >
              {status === 'loading' ? 'Joining...' : 'Join organization'}
            </button>
          </>
        )}
      </div>
    </PageLayout>
  );
};
