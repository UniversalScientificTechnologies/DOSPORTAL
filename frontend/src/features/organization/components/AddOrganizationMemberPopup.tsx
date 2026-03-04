import { useState } from 'react';
import axios from 'axios';
import { theme } from '@/theme';
import { useOrganizationsMembersCreate, useOrganizationsInvitesCreate } from '@/api/organizations/organizations';
import type { OrganizationsMembersCreateMutationBody, OrganizationsInvitesCreateMutationBody } from '@/api/organizations/organizations';
import { Modal } from '@/shared/components/common/Modal';
import { Button } from '@/shared/components/Button/Button';
import { LabeledInput } from '@/shared/components/common/LabeledInput';

export const AddOrganizationMemberPopup = ({
  open,
  onClose,
  orgId,
  orgName,
  onMemberAdded,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  onMemberAdded?: (username: string) => void;
}) => {
  const [username, setUsername] = useState('');
  const [userType, setUserType] = useState('ME');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [mode, setMode] = useState<'form' | 'invite'>('form');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMemberMutation = useOrganizationsMembersCreate();
  const createInviteMutation = useOrganizationsInvitesCreate();

  const loading = addMemberMutation.isPending || createInviteMutation.isPending;

  const handleAdd = async () => {
    if (!username.trim()) return;
    setError(null);
    try {
      await addMemberMutation.mutateAsync({
        orgId,
        data: { username: username.trim(), user_type: userType } as unknown as OrganizationsMembersCreateMutationBody,
      });
      if (onMemberAdded) onMemberAdded(username.trim());
      setUsername('');
      setUserType('ME');
      onClose();
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as Record<string, string> | undefined)?.detail ?? err.message
        : err instanceof Error ? err.message : 'Failed to add member';
      setError(detail);
    }
  };

  const handleInvite = async () => {
    setError(null);
    try {
      const res = await createInviteMutation.mutateAsync({
        orgId,
        data: { user_type: userType } as unknown as OrganizationsInvitesCreateMutationBody,
      });
      const data = res.data as unknown as { invite_url: string };
      setInviteLink(window.location.origin + data.invite_url);
      setMode('invite');
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as Record<string, string> | undefined)?.detail ?? err.message
        : err instanceof Error ? err.message : 'Failed to generate invite link';
      setError(detail);
    }
  };

  if (!open) return null;

  const handleClose = () => { setUsername(''); setInviteLink(null); setMode('form'); onClose(); };

  return (
    <Modal title="Add Member" onClose={handleClose}>
      {mode === 'form' && (
        <>
          <LabeledInput
            id="add-member-username"
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter username..."
            disabled={loading}
          />
          <LabeledInput
            id="add-member-role"
            label="Role"
            type="select"
            value={userType}
            onChange={e => setUserType(e.target.value)}
            disabled={loading}
            options={[
              { value: 'ME', label: 'Member' },
              { value: 'AD', label: 'Admin' },
            ]}
          />
          {error && <div style={{ color: theme.colors.danger, marginBottom: theme.spacing.sm }}>{error}</div>}
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <Button variant='success' onClick={handleAdd} disabled={loading}>
              {loading ? 'Adding...' : 'Invite'}
            </Button>
            <Button variant='outline' onClick={handleInvite} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Invite Link'}
            </Button>
          </div>
        </>
      )}
      {mode === 'invite' && (
        <>
          <LabeledInput
            id="invite-link"
            label="Invite Link"
            value={inviteLink || ''}
            onChange={() => {}}
            disabled
          />
          <div style={{ marginBottom: theme.spacing.md, color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>
            <b>Organization:</b> {orgName || orgId}<br />
            <b>Role:</b> {userType === 'ME' ? 'Member' : userType === 'AD' ? 'Admin' : userType}<br /><br />
            This invite link is valid for 24 hours and can be used once. Send it to your new member.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant='ghost' onClick={() => { setInviteLink(null); setMode('form'); setCopied(false); }}>
              ← Back
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <Button
                variant='outline'
                onClick={() => {
                  if (inviteLink) {
                    navigator.clipboard.writeText(inviteLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }
                }}
              >
                Copy Link
              </Button>
              {copied && <span style={{ color: theme.colors.success, fontSize: theme.typography.fontSize.sm }}>Copied!</span>}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};
