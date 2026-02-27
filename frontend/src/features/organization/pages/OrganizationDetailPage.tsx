import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/shared/components/Layout/PageLayout';
import { theme } from '@/theme';
import profileBg from '@/assets/img/SPACEDOS01.jpg';
import { FormField } from '@/shared/components/common/FormField'
import { AddOrganizationMemberPopup } from '@/components/AddOrganizationMemberPopup';
import { SortableTable } from '@/shared/components/common/SortableTable';
import type { TableColumn } from '@/shared/components/common/SortableTable';
import { SuccessToast } from '@/shared/components/common/SuccessToast';
import {
  useOrganizationsRetrieve,
  useOrganizationsPartialUpdate,
  useOrganizationsMembersUpdate,
  useOrganizationsMembersDestroy,
  getOrganizationsRetrieveQueryKey,
} from '@/api/organizations/organizations';
import { useDetectorsList } from '@/api/detectors/detectors';
import { useUserOrganizationsList } from '@/api/authentication/authentication';
import type { OrganizationDetailRequest, PatchedOrganizationDetailRequest } from '@/api/model';
import { Button } from '@/shared/components/Button/Button';
import { Section } from '@/shared/components/Layout/Section';
import { Modal } from '@/shared/components/common/Modal';
import { LabeledInput } from '@/components/LabeledInput';

type Member = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  user_type: 'OW' | 'AD' | 'ME';
};

type Detector = {
  id: string;
  name: string;
  sn: string;
  type: {
    name: string;
    manufacturer: {
      name: string;
    };
  };
  owner: {
    id: string;
    name: string;
  } | null;
};

type MemberManageState = {
  editingId: number | null;
  newRole: string;
  deletingId: number | null;
};

export const OrganizationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [memberManage, setMemberManage] = useState<MemberManageState>({ editingId: null, newRole: '', deletingId: null });
  const [showAddMember, setShowAddMember] = useState(false);

  const orgQuery = useOrganizationsRetrieve(id!);
  const userOrgsQuery = useUserOrganizationsList();
  const detectorsQuery = useDetectorsList({ owner: id });

  const partialUpdateMutation = useOrganizationsPartialUpdate();
  const changeRoleMutation = useOrganizationsMembersUpdate();
  const deleteMemberMutation = useOrganizationsMembersDestroy();

  const org = orgQuery.data?.data;
  const userOrgs = userOrgsQuery.data?.data ?? [];
  const detectors = (detectorsQuery.data?.data?.results ?? []) as unknown as Detector[];
  const members = (org?.members as unknown as Member[]) ?? [];

  const saving = changeRoleMutation.isPending || deleteMemberMutation.isPending;
  const readOnly = !userOrgs.some((o) => String(o.id) === String(id) && (o.user_type === 'OW' || o.user_type === 'AD'));

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaveField = async (field: string, value: string) => {
    setSaveError(null);
    try {
      await partialUpdateMutation.mutateAsync({
        orgId: id!,
        data: { [field]: value || null } as PatchedOrganizationDetailRequest,
      });
      await queryClient.invalidateQueries({ queryKey: getOrganizationsRetrieveQueryKey(id) });
      showSuccess('Organization updated successfully!');
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as Record<string, string> | undefined)?.detail ?? err.message
        : err instanceof Error ? err.message : 'Save failed';
      setSaveError(detail);
      throw err;
    }
  };

  const handleChangeRole = async (memberId: number, newRole: string) => {
    setSaveError(null);
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    try {
      await changeRoleMutation.mutateAsync({
        orgId: id!,
        username: member.username,
        data: { user_type: newRole } as unknown as OrganizationDetailRequest,
      });
      showSuccess('Role updated successfully!');
      setMemberManage({ editingId: null, newRole: '', deletingId: null });
      await queryClient.invalidateQueries({ queryKey: getOrganizationsRetrieveQueryKey(id) });
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as Record<string, string> | undefined)?.detail ?? err.message
        : err instanceof Error ? err.message : 'Failed to change role';
      setSaveError(detail);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    setSaveError(null);
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    try {
      await deleteMemberMutation.mutateAsync({ orgId: id!, username: member.username });
      showSuccess('Member removed successfully!');
      setMemberManage({ editingId: null, newRole: '', deletingId: null });
      await queryClient.invalidateQueries({ queryKey: getOrganizationsRetrieveQueryKey(id) });
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as Record<string, string> | undefined)?.detail ?? err.message
        : err instanceof Error ? err.message : 'Failed to remove member';
      setSaveError(detail);
    }
  };

  const detectorColumns: TableColumn<Detector>[] = [
    {
      id: 'name',
      key: 'name',
      label: 'Name',
      render: (value) => (
        <span style={{
          color: theme.colors.primary,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          {String(value)}
        </span>
      ),
    },
    {
      id: 'sn',
      key: 'sn',
      label: 'Serial Number',
    },
    {
      id: 'type',
      key: 'type',
      label: 'Type',
      render: (value) => {
        const type = value as { name: string };
        return type.name;
      },
    },
    {
      id: 'manufacturer',
      key: 'type',
      label: 'Manufacturer',
      sortable: false,
      render: (value) => {
        const type = value as { manufacturer: { name: string } };
        return type.manufacturer.name;
      },
    },
  ];

  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${profileBg})`}>
      <SuccessToast message={successMsg}/>
      <Section title="Organization Details" backLink={{ to: '/profile', label: 'Back to Profile' }}>
        {orgQuery.isLoading ? (
          <div style={{ padding: theme.spacing['3xl'] }}>Loading...</div>
        ) : orgQuery.error ? (
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>{String(orgQuery.error)}</div>
        ) : org ? (
          <div className="panel-body">
            {saveError && <div style={{ color: theme.colors.danger, marginBottom: theme.spacing.md }}>{saveError}</div>}
            <FormField
              label="Name"
              value={org.name}
              isReadOnly={readOnly}
              isSaving={partialUpdateMutation.isPending}
              onSave={(value) => handleSaveField('name', value)}
            />
            <FormField
              label="Data Policy"
              value={org.data_policy ?? ''}
              isReadOnly={readOnly}
              isSaving={partialUpdateMutation.isPending}
              onSave={value => handleSaveField('data_policy', value)}
              type="select"
              options={[
                { value: 'PR', label: 'Private' },
                { value: 'PU', label: 'Public' },
                { value: 'NV', label: 'Non-public' },
              ]}
            />
            <FormField
              label="Website"
              value={org.website || ''}
              isReadOnly={readOnly}
              isSaving={partialUpdateMutation.isPending}
              onSave={(value) => handleSaveField('website', value)}
              type="url"
            />
            <FormField
              label="Contact Email"
              value={org.contact_email || ''}
              isReadOnly={readOnly}
              isSaving={partialUpdateMutation.isPending}
              onSave={(value) => handleSaveField('contact_email', value)}
              type="email"
            />
            <FormField
              label="Description"
              value={org.description || ''}
              isReadOnly={readOnly}
              isSaving={partialUpdateMutation.isPending}
              onSave={(value) => handleSaveField('description', value)}
              type="textarea"
            />
            

            {/* Members Section */}
            {members.length > 0 && (
              <Section title='Members' actions={<Button variant='success' size='md' onClick={() => setShowAddMember(true)}>+ Add Member</Button>}>

                <div style={{ marginTop: theme.spacing.md }}>
                  {members.length === 0 ? (
                    <div style={{ color: theme.colors.muted, fontStyle: 'italic' }}>No members yet.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {members.map((member) => {
                        const isManaging = memberManage.editingId === member.id;
                        const canManage = !readOnly && member.user_type !== 'OW';
                        return (
                          <li key={member.id} style={{
                            padding: `${theme.spacing.sm} 0`,
                            borderBottom: `1px solid ${theme.colors.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <span style={{color: theme.colors.textSecondary}}>
                              @{member.username}
                              {member.first_name || member.last_name ? (
                                <span style={{ color: theme.colors.textDark, marginLeft: theme.spacing.sm }}>
                                  {member.first_name} {member.last_name}
                                </span>
                              ) : null}
                            </span>
                            <span style={{ color: theme.colors.textSecondary, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                              {canManage && !isManaging && (
                                <Button variant='ghost' size='md' onClick={() => setMemberManage({ editingId: member.id, newRole: member.user_type, deletingId: null })} style={{color: theme.colors.primary}}>
                                  Manage
                                </Button>
                              )}

                              {!isManaging && (
                                <span>{member.user_type === 'OW' ? 'Owner' : member.user_type === 'AD' ? 'Admin' : 'Member'}</span>
                              )}
                            </span>
                            {/* Popup for manage actions */}
                            {isManaging && (
                              <Modal
                                title={`Manage Member: @${member.username}${member.first_name || member.last_name ? ` (${member.first_name} ${member.last_name})` : ''}`}
                                onClose={() => setMemberManage({ editingId: null, newRole: '', deletingId: null })}
                              >
                                <LabeledInput
                                    id="member-role"
                                    label="Change Role"
                                    type="select"
                                    value={memberManage.newRole || member.user_type}
                                    onChange={e => setMemberManage({ ...memberManage, newRole: e.target.value })}
                                    disabled={saving}
                                    options={[
                                      { value: 'ME', label: 'Member' },
                                      { value: 'AD', label: 'Admin' },
                                    ]}
                                  />
                                  <div style={{ display: 'flex', gap: theme.spacing.md }}>
                                    <Button variant='primary' size='md' disabled={saving || (memberManage.newRole === member.user_type)}
                                      onClick={() => handleChangeRole(member.id, memberManage.newRole || member.user_type)}>
                                      Change
                                    </Button>
                                    <Button variant='danger' disabled={saving}
                                      onClick={() => handleDeleteMember(member.id)}>
                                      Remove
                                    </Button>
                                    <Button
                                      variant='secondary'
                                      disabled={saving}
                                      onClick={() => setMemberManage({ editingId: null, newRole: '', deletingId: null })}>
                                      Cancel
                                    </Button>
                                  </div>
                              </Modal>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <AddOrganizationMemberPopup
                  open={showAddMember}
                  orgId={org.id}
                  orgName={org.name}
                  onClose={() => setShowAddMember(false)}
                  onMemberAdded={async (username: string) => {
                    showSuccess(`Member ${username} added successfully!`);
                    await queryClient.invalidateQueries({ queryKey: getOrganizationsRetrieveQueryKey(id) });
                  }}
                />
              </Section>
            )}

            {/* Detectors Section */}
            <Section title='Detectors' style={{marginTop: theme.spacing.sm}}>
              <SortableTable
                columns={detectorColumns}
                data={detectors}
                onRowClick={(detector) => navigate(`/logbook/${detector.id}`)}
                defaultSortField="name"
                defaultSortDirection="asc"
                getRowKey={(detector) => detector.id}
                emptyMessage='No devices.'
              />
            </Section>
            

            <div style={{ marginBottom: theme.spacing.sm, marginTop: theme.spacing.md }}>
              <strong>Organization Created:</strong> {org.created_at ? new Date(org.created_at).toLocaleString() : ''}
            </div>
          </div>
        ) : null}
      </Section>
    </PageLayout>
  );
};
