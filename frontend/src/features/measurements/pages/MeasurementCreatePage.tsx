import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { AppSelect } from '@/shared/components/common/AppSelect'
import type { SelectOption } from '@/shared/components/common/AppSelect'
import { LabeledInput } from '@/shared/components/common/LabeledInput'
import { theme } from '@/theme'
import { useUserOrganizationsOwnedList } from '@/api/authentication/authentication'
import { useMeasurementsCreate } from '@/api/measurements/measurements'
import type { MeasurementTypeEnum } from '@/api/model'
import { Button } from '@/shared/components/Button/Button'

const MEASUREMENT_TYPES = [
  { value: 'D', label: 'Debug' },
  { value: 'S', label: 'Static' },
  { value: 'M', label: 'Mobile (ground)' },
  { value: 'C', label: 'Civil airborne' },
  { value: 'A', label: 'Special airborne' },
]

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: theme.spacing.xs,
  fontWeight: theme.typography.fontWeight.medium,
  color: theme.colors.textDark,
  fontSize: theme.typography.fontSize.sm,
}

const fieldWrapper: React.CSSProperties = {
  marginBottom: theme.spacing['2xl'],
}

export const MeasurementCreatePage = () => {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [measurementType, setMeasurementType] = useState<SelectOption>({ value: 'S', label: 'Static' })
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [ownerId, setOwnerId] = useState<SelectOption | null>(null)
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const orgsQuery = useUserOrganizationsOwnedList()
  const orgs = (orgsQuery.data?.data ?? []).map((o) => ({ value: o.id, label: o.name }))

  const createMeasurement = useMeasurementsCreate()

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Measurement name is required.'); return }
    setError(null)
    setSubmitting(true)
    try {
      const measResult = await createMeasurement.mutateAsync({
        data: {
          name: name.trim(),
          measurement_type: measurementType.value as MeasurementTypeEnum,
          description,
          public: isPublic,
          owner_id: ownerId?.value ?? null,
          time_start: timeStart || null,
          time_end: timeEnd || null,
        },
      })
      const measurement = measResult.data as unknown as { id: string }
      navigate(`/measurement/edit/${measurement.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout>
      <Section title='Create Measurement'
        actions={
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting ? 'Creating…' : 'Create Measurement'}
          </Button>}
        error={error}
      >
        <Section title="Details">
          <LabeledInput
            id="meas-name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Measurement name"
            required
          />

          <div style={fieldWrapper}>
            <label style={labelStyle}>Measurement Type</label>
            <AppSelect
              options={MEASUREMENT_TYPES}
              value={measurementType}
              onChange={(opt) => setMeasurementType(opt ?? { value: 'S', label: 'Static' })}
              isSearchable={false}
            />
          </div>

          <div style={fieldWrapper}>
            <label style={labelStyle}>
              Owner Organization <span style={{ color: theme.colors.mutedLight, fontWeight: 'normal' }}>(optional)</span>
            </label>
            <AppSelect
              options={orgs}
              value={ownerId}
              onChange={setOwnerId}
              placeholder="— Personal —"
              isClearable
            />
          </div>

          <div style={{ ...fieldWrapper, display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <input
              type="checkbox"
              id="meas-public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: theme.colors.primary }}
            />
            <label htmlFor="meas-public" style={{ ...labelStyle, margin: 0, cursor: 'pointer' }}>
              Publicly visible
            </label>
          </div>

          <LabeledInput
            id="meas-time-start"
            label="Start time (optional)"
            type="datetime-local"
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
          />

          <LabeledInput
            id="meas-time-end"
            label="End time (optional)"
            type="datetime-local"
            value={timeEnd}
            onChange={(e) => setTimeEnd(e.target.value)}
          />

          <LabeledInput
            id="meas-description"
            label="Description (optional)"
            type="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes about this measurement…"
            rows={4}
          />
        </Section>
      </Section>
    </PageLayout>
  )
}
