import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import profileBg from '@/assets/img/SPACEDOS01.jpg'
import { theme } from '@/theme'
import { LabeledInput } from '@/components/LabeledInput'
import { useOrganizationsCreate } from '@/api/organizations/organizations'
import type { DataPolicyEnum } from '@/api/model'
import { Button } from '@/shared/components/Button/Button'
import { PanelHeader } from '@/shared/components/Layout/PanelHeader'



export const CreateOrganizationPage = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [dataPolicy, setDataPolicy] = useState<DataPolicyEnum>('PU')
  const [website, setWebsite] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useOrganizationsCreate()

  const dataPolicyChoices: { value: DataPolicyEnum; label: string }[] = [
    { value: 'PR', label: 'Private' },
    { value: 'PU', label: 'Public' },
    { value: 'NV', label: 'Non-public' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    let websiteToSubmit = website.trim()
    if (websiteToSubmit && !/^https?:\/\//i.test(websiteToSubmit)) {
      websiteToSubmit = 'https://' + websiteToSubmit
    }

    try {
      await createMutation.mutateAsync({
        data: {
          name,
          data_policy: dataPolicy,
          website: websiteToSubmit || null,
          contact_email: contactEmail || null,
          description: description || null,
        },
      })
      navigate('/profile')
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as Record<string, string> | undefined)?.detail ?? err.message
        : err instanceof Error ? err.message : 'An error occurred'
      setError(detail)
    }
  }

  const submitting = createMutation.isPending

  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${profileBg})`}>
      <section className="panel">
        <PanelHeader
          title="Create New Organization"
          subtitle="Set up a new organization to manage detectors, measurements data and collaborate with team members."
        />

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

            <LabeledInput
              id="data_policy"
              label="Data Policy"
              type="select"
              value={dataPolicy}
              onChange={(e) => setDataPolicy(e.target.value as DataPolicyEnum)}
              options={dataPolicyChoices}
              hint={<><strong>Public:</strong> visible to all users • <strong>Non-public:</strong> restricted access • <strong>Private:</strong> members only</>}
            />

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

            <LabeledInput
              id="description"
              label="Description"
              type="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your organization, its mission, and research focus..."
              rows={5}
            />

            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Button variant='success' size='md' type='submit' disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Organization'}
              </Button>
              <Button variant='secondary' size='md' to='/profile'>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </section>
    </PageLayout>
  )
}
