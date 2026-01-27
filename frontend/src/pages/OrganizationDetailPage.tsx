import { useEffect, useState } from 'react';

import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { theme } from '../theme';
import profileBg from '../assets/img/SPACEDOS01.jpg';
import { FormField } from '../components/FormField';
import { AddOrganizationMemberPopup } from '../components/AddOrganizationMemberPopup';

type Member = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  user_type: 'OW' | 'AD' | 'ME';
};

export const OrganizationDetailPage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string;
  isAuthed: boolean;
  getAuthHeader: () => { Authorization?: string };
}) => {
  const { id } = useParams();
  const [org, setOrg] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userOrgs, setUserOrgs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchOrg = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/organizations/${id}/`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Error');
      const data = await res.json();
      setOrg(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthed) return;
    fetchOrg();
  }, [id, apiBase, isAuthed, getAuthHeader]);

  useEffect(() => {
    if (!isAuthed) return;
    fetch(`${apiBase}/user/organizations/`, {
      headers: { ...getAuthHeader() },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).detail || 'Error');
        return res.json();
      })
      .then(setUserOrgs)
      .catch(() => {});
  }, [apiBase, isAuthed, getAuthHeader]);



  const handleSaveField = async (field: string, value: string) => {
    setSaving(true);
    setSaveError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${apiBase}/organizations/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Save failed');
      const updated = await res.json();
      setOrg(updated);
      setEditingField(null);
      setSuccessMsg('Organization updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };


  // Determine if user is owner/admin of this org
  const readOnly = !userOrgs.some((o) => String(o.id) === String(id) && (o.user_type === 'OW' || o.user_type === 'AD'));

  if (!isAuthed) {
    return (
      <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${profileBg})`}>
        <div className="panel">
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
            Login required to view organization.
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${profileBg})`}>
      {/* Fixed position success message */}
      {successMsg && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            backgroundColor: theme.colors.successBg || '#e6ffed',
            color: theme.colors.successText || '#1a7f37',
            padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
            borderRadius: theme.borders.radius.sm,
            border: `${theme.borders.width} solid ${theme.colors.successBorder || '#b7eb8f'}`,
            boxShadow: theme.shadows.sm,
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          ✓ {successMsg}
        </div>
      )}
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <section className="panel">
          <header className="panel-header">
            <div>
              <Link
                to="/profile"
                style={{
                  color: theme.colors.muted,
                  textDecoration: 'none',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: theme.transitions.fast,
                  display: 'inline-block',
                  marginBottom: theme.spacing.md,
                }}
              >
                ← Back to Profile
              </Link>
              <h2 style={{ marginTop: 0, marginBottom: theme.spacing.xs }}>
                Organization Details
              </h2>
            </div>
          </header>
          {loading ? (
            <div style={{ padding: theme.spacing['3xl'] }}>Loading...</div>
          ) : error ? (
            <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>{error}</div>
          ) : org ? (
            <div className="panel-body">
              {saveError && <div style={{ color: theme.colors.danger, marginBottom: theme.spacing.md }}>{saveError}</div>}
              <FormField
                label="Name"
                value={org.name}
                isReadOnly={readOnly}
                isSaving={saving && editingField === 'name'}
                onEdit={() => setEditingField('name')}
                isEditing={editingField === 'name'}
                onSave={(value) => handleSaveField('name', value)}
                onCancel={() => setEditingField(null)}
              />
              <FormField
                label="Data Policy"
                value={org.data_policy}
                isReadOnly={readOnly}
                isSaving={saving && editingField === 'data_policy'}
                isEditing={editingField === 'data_policy'}
                onEdit={() => setEditingField('data_policy')}
                onSave={value => handleSaveField('data_policy', value)}
                onCancel={() => setEditingField(null)}
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
                isSaving={saving && editingField === 'website'}
                isEditing={editingField === 'website'}
                onEdit={() => setEditingField('website')}
                onSave={(value) => handleSaveField('website', value)}
                onCancel={() => setEditingField(null)}
                type="url"
              />
              <FormField
                label="Contact Email"
                value={org.contact_email || ''}
                isReadOnly={readOnly}
                isSaving={saving && editingField === 'contact_email'}
                isEditing={editingField === 'contact_email'}
                onEdit={() => setEditingField('contact_email')}
                onSave={(value) => handleSaveField('contact_email', value)}
                onCancel={() => setEditingField(null)}
                type="email"
              />
              <FormField
                label="Description"
                value={org.description || ''}
                isReadOnly={readOnly}
                isSaving={saving && editingField === 'description'}
                isEditing={editingField === 'description'}
                onEdit={() => setEditingField('description')}
                onSave={(value) => handleSaveField('description', value)}
                onCancel={() => setEditingField(null)}
                type="textarea"
              />
              

              {/* Members Section */}
              {org.members && (
                <section className="panel" style={{ marginTop: theme.spacing['2xl'], padding: theme.spacing.md }}>
                  <header className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Members</h3>
                    <button
                      type="button"
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                        background: theme.colors.success,
                        color: 'white',
                        border: 'none',
                        borderRadius: theme.borders.radius.sm,
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.medium,
                        cursor: 'pointer',
                        transition: theme.transitions.fast,
                      }}
                      onClick={() => setShowAddMember(true)}
                    >
                      + Add Member
                    </button>
                  </header>
                  <div style={{ marginTop: theme.spacing.md }}>
                    {org.members.length === 0 ? (
                      <div style={{ color: theme.colors.muted, fontStyle: 'italic' }}>No members yet.</div>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {org.members.map((member: Member) => (
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
                            <span style={{ color: theme.colors.textSecondary, fontWeight: 500 }}>
                              {member.user_type === 'OW' ? 'Owner' : member.user_type === 'AD' ? 'Admin' : 'Member'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <AddOrganizationMemberPopup
                    open={showAddMember}
                    orgId={org.id}
                    apiBase={apiBase}
                    getAuthHeader={getAuthHeader}
                    onClose={() => setShowAddMember(false)}
                    onMemberAdded={async (username: string) => {
                      setSuccessMsg(`Member ${username} added successfully!`);
                      setTimeout(() => setSuccessMsg(null), 3000);
                      await fetchOrg();
                    }}
                  />
                </section>
              )}
              <div style={{ marginBottom: theme.spacing['2xl'] }}>
                <strong>Organization Created:</strong> {org.created_at ? new Date(org.created_at).toLocaleString() : ''}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </PageLayout>
  );
};
