import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { theme } from '../theme';
import profileBg from '../assets/img/SPACEDOS01.jpg';

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

  useEffect(() => {
    if (!isAuthed) return;
    fetch(`${apiBase}/organizations/${id}/`, {
      headers: { ...getAuthHeader() },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).detail || 'Error');
        return res.json();
      })
      .then(setOrg)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, apiBase, isAuthed, getAuthHeader]);

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
              <div style={{ marginBottom: theme.spacing['2xl'] }}>
                <strong>Name:</strong> {org.name}
              </div>
              <div style={{ marginBottom: theme.spacing['2xl'] }}>
                <strong>Data Policy:</strong> {(() => {
                  const map = { PR: 'Private', PU: 'Public', NV: 'Non-public' };
                  return map[org.data_policy] || org.data_policy;
                })()}
              </div>
              <div style={{ marginBottom: theme.spacing['2xl'] }}>
                <strong>Website:</strong> {org.website ? (
                  <a href={org.website} target="_blank" rel="noopener noreferrer">{org.website}</a>
                ) : (
                  <span style={{ color: theme.colors.muted }}>N/A</span>
                )}
              </div>
              <div style={{ marginBottom: theme.spacing['2xl'] }}>
                <strong>Contact Email:</strong> {org.contact_email || <span style={{ color: theme.colors.muted }}>N/A</span>}
              </div>
              <div style={{ marginBottom: theme.spacing['2xl'] }}>
                <strong>Description:</strong> {org.description || <span style={{ color: theme.colors.muted }}>N/A</span>}
              </div>
              <div style={{ marginBottom: theme.spacing['2xl'] }}>
                <strong>Created:</strong> {org.created_at ? new Date(org.created_at).toLocaleString() : ''}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </PageLayout>
  );
};
