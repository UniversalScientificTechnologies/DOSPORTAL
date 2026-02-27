import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { SortableTable } from '@/shared/components/common/SortableTable'
import type { TableColumn } from '@/shared/components/common/SortableTable'
import { AppSelect } from '@/shared/components/common/AppSelect'
import type { SelectOption } from '@/shared/components/common/AppSelect'
import { LabeledInput } from '@/components/LabeledInput'
import { theme } from '@/theme'
import { useUserOrganizationsOwnedList } from '@/api/authentication/authentication'
import { useMeasurementsCreate, useMeasurementSegmentsCreate } from '@/api/measurements/measurements'
import type { MeasurementTypeEnum } from '@/api/model'
import { Button } from '@/shared/components/Button/Button'

type SpectralRecord = {
  id: string
  name: string
  created: string
  author: string | null
  owner: string | null
  raw_file_id: string | null
  artifacts_count: number
  time_start: string | null
  record_duration: number | null
}

const MEASUREMENT_TYPES = [
  { value: 'D', label: 'Debug' },
  { value: 'S', label: 'Static' },
  { value: 'M', label: 'Mobile (ground)' },
  { value: 'C', label: 'Civil airborne' },
  { value: 'A', label: 'Special airborne' },
]

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}

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
  const location = useLocation()
  const selectedRecords: SpectralRecord[] = location.state?.selectedRecords ?? []

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
  const createSegment = useMeasurementSegmentsCreate()

  const columns: TableColumn<SpectralRecord>[] = [
    {
      id: 'name', key: 'name', label: 'Name',
      render: (v) => (
        <span style={{ color: theme.colors.primary, fontWeight: theme.typography.fontWeight.medium }}>
          {String(v)}
        </span>
      ),
    },
    {
      id: 'owner', key: 'owner', label: 'Owner',
      render: (v) => v ? String(v) : <span style={{ color: theme.colors.mutedLight }}>—</span>,
    },
    {
      id: 'time_start', key: 'time_start', label: 'Start time',
      render: (v) => formatDate(v as string | null),
    },
    {
      id: 'created', key: 'created', label: 'Uploaded',
      render: (v) => formatDate(v as string),
    },
  ]

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

      await Promise.all(
        selectedRecords.map((record, index) => {
          const timeFrom = record.time_start ?? null
          const timeTo =
            record.time_start && record.record_duration
              ? new Date(
                  new Date(record.time_start).getTime() + (record.record_duration as unknown as number) * 1000
                ).toISOString()
              : null
          return createSegment.mutateAsync({
            data: {
              measurement: measurement.id,
              spectral_record: record.id,
              time_from: timeFrom,
              time_to: timeTo,
              position: index,
            },
          })
        })
      )

      navigate(`/measurement/${measurement.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout>
      {/* Header bar */}
      <Section title='Create Measurement'
        actions={
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting ? 'Creating…' : 'Create Measurement'}
          </Button>}
        backLink={{ to: '/measurement/create', label: 'Back'}}
        error={error}
      >


      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: theme.spacing.sm,
          alignItems: 'start',
        }}
      >
        {/* ---- Left: form ---- */}
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

        {/* ---- Right: selected records ---- */}
        <Section title={`Selected Records (${selectedRecords.length})`}>
          {selectedRecords.length === 0 ? (
            <div style={{ color: theme.colors.muted, padding: theme.spacing.lg, fontStyle: 'italic', fontSize: theme.typography.fontSize.sm }}>
              No records selected.{' '}
              <span
                style={{ color: theme.colors.primary, cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate('/measurement/create')}
              >
                Go back to select records.
              </span>
            </div>
          ) : (
            <SortableTable
              columns={columns}
              data={selectedRecords}
              defaultSortField="time_start"
              defaultSortDirection="asc"
              getRowKey={(r) => r.id}
              emptyMessage="No records selected."
            />
          )}
        </Section>
      </div>
      </Section>
    </PageLayout>
  )
}
