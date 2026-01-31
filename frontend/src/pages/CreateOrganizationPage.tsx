import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { theme } from '../theme'
import { LabeledInput } from '../components/LabeledInput'
import profileBg from '../assets/img/SPACEDOS01.jpg'

export const CreateOrganizationPage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string
  isAuthed: boolean
  getAuthHeader: () => { Authorization?: string }
}) => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [dataPolicy, setDataPolicy] = useState('PU')
  const [website, setWebsite] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const dataPolicyChoices = [
    { value: 'PR', label: 'Private' },
    { value: 'PU', label: 'Public' },
    { value: 'NV', label: 'Non-public' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    // Auto-prepend https:// if website is non-empty and missing scheme
    let websiteToSubmit = website.trim()
    if (websiteToSubmit && !/^https?:\/\//i.test(websiteToSubmit)) {
      websiteToSubmit = 'https://' + websiteToSubmit
    }

    try {
      const res = await fetch(`${apiBase}/organizations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          name,
          data_policy: dataPolicy,
          website: websiteToSubmit,
          contact_email: contactEmail,
          description,
        }),
      })

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.detail || JSON.stringify(errData) || errMsg;
        } catch {
          errMsg = res.statusText || errMsg;
        }
        throw new Error(errMsg);
      }

      // Success - redirect to profile
      navigate('/profile')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthed) {
    return (
      <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${profileBg})`}>
        <div className="panel">
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
            Login required to create organization.
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${profileBg})`}>
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: theme.spacing.xs }}>
              Create New Organization
            </h2>
            <p className="muted" style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.muted }}>
              Set up a new organization to manage detectors, measurements data and collaborate with team members.
            </p>
          </div>
        </header>

        {error && <div className="error" style={{ marginBottom: theme.spacing.lg }}>{error}</div>}

        <form onSubmit={handleSubmit} className="panel-body">
          <div style={{ maxWidth: '600px' }}>
            <LabeledInput
              id="org_name"
              label="Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Research Lab"
              required
            />

            <div style={{ marginBottom: theme.spacing['2xl'] }}>
              <label 
                htmlFor="data_policy"
                style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textDark }}
              >
                Data Policy
              </label>
              <select
                id="data_policy"
                value={dataPolicy}
                onChange={(e) => setDataPolicy(e.target.value)}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  border: `${theme.borders.width} solid ${theme.colors.border}`,
                  borderRadius: theme.borders.radius.sm,
                  fontSize: theme.typography.fontSize.base,
                  background: theme.colors.bg,
                  color: theme.colors.textDark,
                  boxSizing: 'border-box',
                }}
              >
                {dataPolicyChoices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
              <p style={{ marginTop: theme.spacing.xs, fontSize: theme.typography.fontSize.xs, color: theme.colors.muted, marginBottom: 0 }}>
                <strong>Public:</strong> visible to all users • <strong>Non-public:</strong> restricted access • <strong>Private:</strong> members only
              </p>
            </div>

            <LabeledInput
              id="website"
              label="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />

            <LabeledInput
              id="contact_email"
              label="Contact Email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@example.com"
              type="email"
            />

            <div style={{ marginBottom: theme.spacing['2xl'] }}>
              <label 
                htmlFor="description"
                style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textDark }}
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your organization, its mission, and research focus..."
                rows={5}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  border: `${theme.borders.width} solid ${theme.colors.border}`,
                  borderRadius: theme.borders.radius.sm,
                  fontSize: theme.typography.fontSize.base,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  background: theme.colors.bg,
                  color: theme.colors.textDark,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: theme.spacing.lg }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing['2xl']}`,
                  background: submitting ? theme.colors.muted : theme.colors.success,
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borders.radius.sm,
                  fontSize: theme.typography.fontSize.base,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: theme.transitions.fast,
                }}
              >
                {submitting ? 'Creating...' : 'Create Organization'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/profile')}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing['2xl']}`,
                  background: theme.colors.bg,
                  color: theme.colors.textSecondary,
                  border: `${theme.borders.width} solid ${theme.colors.border}`,
                  borderRadius: theme.borders.radius.sm,
                  fontSize: theme.typography.fontSize.base,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: theme.transitions.fast,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </section>
    </PageLayout>
  )
}
