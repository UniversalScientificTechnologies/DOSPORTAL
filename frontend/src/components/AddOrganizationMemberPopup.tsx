import { useState } from 'react';
import { theme } from '../theme';

export const AddOrganizationMemberPopup = ({
  open,
  onClose,
  orgId,
  apiBase,
  getAuthHeader,
  onMemberAdded,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  apiBase: string;
  getAuthHeader: () => { Authorization?: string };
  onMemberAdded?: (username: string) => void;
}) => {
  const [username, setUsername] = useState('');
  const [userType, setUserType] = useState('ME');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [mode, setMode] = useState<'form' | 'invite'>('form');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/organizations/${orgId}/add_member/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ username: username.trim(), user_type: userType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add member');
      if (onMemberAdded) onMemberAdded(username.trim());
      setUsername('');
      setUserType('ME');
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = () => {
    setInviteLink(`${window.location.origin}/organization/invite/NEWCODE_PLACEHOLDER`);
    setMode('invite');
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.3)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        borderRadius: theme.borders.radius.md,
        boxShadow: theme.shadows.lg,
        padding: theme.spacing['2xl'],
        minWidth: 350,
        maxWidth: 400,
        position: 'relative',
      }}>
        <button
          style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}
          onClick={() => { setUsername(''); setInviteLink(null); setMode('form'); onClose(); }}
          aria-label="Close"
        >×</button>
        <h4 style={{ marginTop: 0 }}>Add Member</h4>
        {mode === 'form' && (
          <>
            <input
              type="text"
              placeholder="Enter username..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{
                width: '100%',
                marginBottom: theme.spacing.md,
                padding: theme.spacing.sm,
                background: theme.colors.bg,
                color: theme.colors.textDark,
                border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                borderRadius: theme.borders.radius.sm,
                fontSize: theme.typography.fontSize.base,
                boxSizing: 'border-box',
              }}
              disabled={loading}
            />
            <select
              value={userType}
              onChange={e => setUserType(e.target.value)}
              style={{
                width: '100%',
                marginBottom: theme.spacing.md,
                padding: theme.spacing.sm,
                background: theme.colors.bg,
                color: theme.colors.textDark,
                border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                borderRadius: theme.borders.radius.sm,
                fontSize: theme.typography.fontSize.base,
                boxSizing: 'border-box',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
              disabled={loading}
            >
              <option value="ME">Member</option>
              <option value="AD">Admin</option>
              {/* <option value="OW">Owner</option> only one owner, can't be added */}
            </select>
            {error && <div style={{ color: theme.colors.danger, marginBottom: theme.spacing.sm }}>{error}</div>}
            <div style={{ display: 'flex', gap: theme.spacing.md }}>
              <button
                type="button"
                style={{ padding: `${theme.spacing.sm} ${theme.spacing.lg}` }}
                onClick={handleAdd}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Invite'}
              </button>
              <button
                type="button"
                style={{ padding: `${theme.spacing.sm} ${theme.spacing.lg}` }}
                onClick={handleInvite}
                disabled={loading}
              >
                Generate Invite Link
              </button>
            </div>
          </>
        )}
        {mode === 'invite' && (
          <>
            <div style={{ marginBottom: theme.spacing.md }}>
              <input
                type="text"
                value={inviteLink || ''}
                readOnly
                style={{
                  width: '95%',
                  marginBottom: theme.spacing.sm,
                  background: theme.colors.bg,
                  color: theme.colors.textDark,
                  border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                  fontSize: theme.typography.fontSize.base,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ marginTop: theme.spacing.sm, color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>
                Send this invite link to your member. The invite link is valid for 24 hours and can be used once.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.md }}>
              <button
                type="button"
                style={{ color: theme.colors.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => { setInviteLink(null); setMode('form'); setCopied(false); }}
              >
                ← Back
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <button
                  type="button"
                  style={{ padding: `${theme.spacing.sm} ${theme.spacing.lg}` }}
                  onClick={() => {
                    if (inviteLink) {
                      navigator.clipboard.writeText(inviteLink);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }
                  }}
                >
                  Copy Link
                </button>
                {copied && <span style={{ color: theme.colors.success, fontSize: theme.typography.fontSize.sm }}>Copied!</span>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
