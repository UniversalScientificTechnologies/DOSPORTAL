import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { Section } from '../components/Section'
import { SortableTable } from '../components/SortableTable'
import type { TableColumn } from '../components/SortableTable'
import { LabeledInput } from '../components/LabeledInput'
import { theme } from '../theme'

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

type OrgOption = { value: string; label: string }

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: theme.spacing.sm,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borders.radius.sm,
  fontSize: theme.typography.fontSize.sm,
  color: theme.colors.textDark,
  backgroundColor: theme.colors.bg,
  boxSizing: 'border-box',
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

const buttonBase: React.CSSProperties = {
  padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
  borderRadius: theme.borders.radius.sm,
  border: '1px solid transparent',
  fontWeight: theme.typography.fontWeight.medium,
  fontSize: theme.typography.fontSize.sm,
  cursor: 'pointer',
}

export const MeasurementCreatePage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string
  isAuthed: boolean
  getAuthHeader: () => { Authorization?: string }
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedRecords: SpectralRecord[] = location.state?.selectedRecords ?? []

  const [name, setName] = useState('')
  const [measurementType, setMeasurementType] = useState('S')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [ownerId, setOwnerId] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthed) return
    fetch(`${apiBase}/user/organizations/owned/`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    })
      .then((r) => r.json())
      .then((data: { id: string; name: string }[]) =>
        setOrgs(data.map((o) => ({ value: o.id, label: o.name })))
      )
      .catch(() => setOrgs([]))
  }, [apiBase, isAuthed, getAuthHeader])

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
      const measRes = await fetch(`${apiBase}/measurement/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          name: name.trim(),
          measurement_type: measurementType,
          description,
          public: isPublic,
          owner_id: ownerId || null,
          time_start: timeStart || null,
          time_end: timeEnd || null,
        }),
      })
      if (!measRes.ok) {
        const err = await measRes.json().catch(() => ({}))
        throw new Error(err?.name?.[0] ?? err?.error ?? `HTTP ${measRes.status}`)
      }
      const measurement = await measRes.json()

      await Promise.all(
        selectedRecords.map((record, index) => {
          const timeFrom = record.time_start ?? null
          const timeTo =
            record.time_start && record.record_duration
              ? new Date(
                  new Date(record.time_start).getTime() + record.record_duration * 1000
                ).toISOString()
              : null
          return fetch(`${apiBase}/measurement-segment/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({
              measurement: measurement.id,
              spectral_record: record.id,
              time_from: timeFrom,
              time_to: timeTo,
              position: index,
            }),
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

  if (!isAuthed) {
    return (
      <PageLayout>
        <div className="panel">
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>Login required.</div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Header bar */}
      <div
        className="panel"
        style={{
          padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
          marginBottom: theme.spacing.lg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ margin: 0, fontSize: theme.typography.fontSize.xl, color: theme.colors.textDark }}>
          Create Measurement
        </h2>
        <div style={{ display: 'flex', gap: theme.spacing.md }}>
          <button
            onClick={() => navigate('/measurement/create', { state: { selectedRecords } })}
            style={{
              ...buttonBase,
              backgroundColor: theme.colors.bg,
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textSecondary,
            }}
          >
            ← Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            style={{
              ...buttonBase,
              backgroundColor:
                submitting || !name.trim() ? theme.colors.mutedLighter : theme.colors.primary,
              color: submitting || !name.trim() ? theme.colors.muted : '#fff',
              cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Creating…' : 'Create Measurement'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            color: theme.colors.danger,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            backgroundColor: '#fff5f5',
            borderRadius: theme.borders.radius.sm,
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: theme.spacing['2xl'],
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
            <select value={measurementType} onChange={(e) => setMeasurementType(e.target.value)} style={inputStyle}>
              {MEASUREMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={fieldWrapper}>
            <label style={labelStyle}>
              Owner Organization <span style={{ color: theme.colors.mutedLight, fontWeight: 'normal' }}>(optional)</span>
            </label>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} style={inputStyle}>
              <option value="">— Personal —</option>
              {orgs.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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

          <div style={fieldWrapper}>
            <label style={labelStyle}>
              Start time <span style={{ color: theme.colors.mutedLight, fontWeight: 'normal' }}>(optional)</span>
            </label>
            <input type="datetime-local" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} style={inputStyle} />
          </div>

          <div style={fieldWrapper}>
            <label style={labelStyle}>
              End time <span style={{ color: theme.colors.mutedLight, fontWeight: 'normal' }}>(optional)</span>
            </label>
            <input type="datetime-local" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} style={inputStyle} />
          </div>

          <div style={fieldWrapper}>
            <label style={labelStyle}>
              Description <span style={{ color: theme.colors.mutedLight, fontWeight: 'normal' }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this measurement…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '6rem' }}
            />
          </div>
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
            />
          )}
        </Section>
      </div>
    </PageLayout>
  )
}
