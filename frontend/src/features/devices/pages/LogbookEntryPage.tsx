import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { LocationSearchMap } from '@/components/LocationSearchMap'
import { theme } from '@/theme'
import logbookBg from '@/assets/img/SPACEDOS01.jpg'
import { useDetectorsRetrieve, useLogbooksRetrieve, useLogbooksCreate, useLogbooksUpdate } from '@/api/detectors/detectors'
import type { EntryTypeEnum, SourceEnum } from '@/api/model'
import { Button } from '@/shared/components/Button/Button'

export const LogbookEntryPage = () => {
  const { id, entryId } = useParams<{ id: string; entryId?: string }>()
  const navigate = useNavigate()
  const isEditMode = !!entryId
  const formInitialized = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Form fields
  const [text, setText] = useState('')
  const [entryType, setEntryType] = useState('note')
  const [isPublic, setIsPublic] = useState(true)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [altitude, setAltitude] = useState('')
  const [locationText, setLocationText] = useState('')

  const entryTypeChoices = [
    { value: 'reset', label: 'Reset' },
    { value: 'sync', label: 'Sync' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'note', label: 'Note' },
    { value: 'location_update', label: 'Location update' },
    { value: 'calibration', label: 'Calibration' },
    { value: 'other', label: 'Other' },
  ]

  const detectorQuery = useDetectorsRetrieve(id!, { query: { enabled: !!id } })
  const detector = detectorQuery.data?.data

  const entryQuery = useLogbooksRetrieve(entryId!, { query: { enabled: isEditMode && !!entryId } })
  const entry = entryQuery.data?.data

  useEffect(() => {
    if (entry && !formInitialized.current) {
      formInitialized.current = true
      setText(entry.text || '')
      setEntryType(entry.entry_type || 'note')
      setIsPublic(entry.public ?? true)
      setLatitude(entry.latitude?.toString() || '')
      setLongitude(entry.longitude?.toString() || '')
      setAltitude(entry.altitude?.toString() || '')
      setLocationText(entry.location_text || '')
    }
  }, [entry])

  const createMutation = useLogbooksCreate()
  const updateMutation = useLogbooksUpdate()

  const loading = detectorQuery.isLoading || (isEditMode && entryQuery.isLoading)
  const error = detectorQuery.error
    ? `Failed to load detector: ${(detectorQuery.error as Error)?.message ?? 'Unknown error'}`
    : (isEditMode && entryQuery.error)
      ? `Failed to load logbook entry: ${(entryQuery.error as Error)?.message ?? 'Unknown error'}`
      : submitError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        detector: id,
        text,
        entry_type: entryType as EntryTypeEnum,
        public: isPublic,
        source: 'web' as SourceEnum,
        ...(latitude && { latitude: parseFloat(latitude) }),
        ...(longitude && { longitude: parseFloat(longitude) }),
        ...(altitude && { altitude: parseFloat(altitude) }),
        ...(locationText && { location_text: locationText }),
      }

      if (isEditMode && entryId) {
        await updateMutation.mutateAsync({ id: entryId, data: payload })
      } else {
        await createMutation.mutateAsync({ data: payload })
      }

      navigate(`/device/${id}`)
    } catch (e: unknown) {
      setSubmitError(`Failed to ${isEditMode ? 'update' : 'create'} entry: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString())
          setLongitude(position.coords.longitude.toString())
          if (position.coords.altitude) {
            setAltitude(position.coords.altitude.toString())
          }
        },
        (error) => {
          setSubmitError(`Failed to get location: ${error.message}`)
        }
      )
    } else {
      setSubmitError('Geolocation is not supported by your browser')
    }
  }

  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}>
      <section className="panel">
        <header className="panel-header">
          <div>
            <Link 
              to={`/device/${id}`} 
              style={{ color: theme.colors.muted, textDecoration: 'none', fontSize: theme.typography.fontSize.sm }}
            >
              ← Back to Logbook
            </Link>
            <h2 style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>
              {isEditMode ? 'Edit Logbook Entry' : 'Create Logbook Entry'}
            </h2>
            {detector && (
              <p className="muted" style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.muted }}>
                {detector.name} (TYPE: {detector.type?.name} · ID: {detector.id})
              </p>
            )}
          </div>
        </header>

        {error && <div className="error" style={{ marginBottom: theme.spacing.lg }}>{error}</div>}
        {loading && <p className="muted">Loading detector...</p>}

        {!loading && detector && (
          <form onSubmit={handleSubmit} className="panel-body">
            <div style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: theme.spacing['2xl'] }}>
                <label 
                  htmlFor="entry_type" 
                  style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textDark }}
                >
                  Entry Type *
                </label>
                <select
                  id="entry_type"
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    border: `${theme.borders.width} solid ${theme.colors.border}`,
                    borderRadius: theme.borders.radius.sm,
                    fontSize: theme.typography.fontSize.base,
                    background: theme.colors.bg,
                    color: theme.colors.textDark,
                  }}
                >
                  {entryTypeChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: theme.spacing['2xl'] }}>
                <label 
                  htmlFor="text" 
                  style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textDark }}
                >
                  Description *
                </label>

                <textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  rows={6}
                  placeholder="Detailed description of activity made on the detector..."
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
                  }}
                />
              </div>

              <div style={{ marginBottom: theme.spacing['2xl'] }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    style={{ marginRight: theme.spacing.sm, width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Make this entry visible to everyone</span>
                </label>
                <p style={{ marginTop: theme.spacing.xs, fontSize: theme.typography.fontSize.sm, color: theme.colors.muted, marginLeft: '26px' }}>
                  Private logbook will be visible for maintainers of detector and for dosportal admins.
                </p>
              </div>

              <div style={{ 
                background: theme.colors.bg, 
                border: `${theme.borders.width} solid ${theme.colors.border}`, 
                borderRadius: theme.borders.radius.md,
                padding: theme.spacing['2xl'],
                marginBottom: theme.spacing['2xl']
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
                  <h3 style={{ margin: 0, fontSize: theme.typography.fontSize.base, color: theme.colors.textDark, fontWeight: theme.typography.fontWeight.semibold }}>
                    Location (Optional)
                  </h3>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                      background: theme.colors.muted,
                      color: 'white',
                      border: 'none',
                      borderRadius: theme.borders.radius.sm,
                      fontSize: theme.typography.fontSize.sm,
                      cursor: 'pointer',
                      fontWeight: theme.typography.fontWeight.medium,
                      transition: theme.transitions.fast,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
                    onMouseLeave={(e) => e.currentTarget.style.background = theme.colors.muted}
                    title="Use Browser to get your current location"
                  >
                    📍 Current Location
                  </button>
                </div>

                <div style={{ marginBottom: theme.spacing.lg }}>
                  <LocationSearchMap
                    onLocationSelect={(data) => {
                      setLatitude(data.latitude.toString())
                      setLongitude(data.longitude.toString())
                      setLocationText(data.location_text)
                    }}
                    initialLat={latitude ? parseFloat(latitude) : undefined}
                    initialLng={longitude ? parseFloat(longitude) : undefined}
                    initialLocationText={locationText}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label 
                      htmlFor="latitude" 
                      style={{ display: 'block', marginBottom: theme.spacing.xs, fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.typography.fontWeight.medium }}
                    >
                      Latitude
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      step="any"
                      placeholder="e.g., 49.8175"
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: `${theme.borders.width} solid ${theme.colors.border}`,
                        borderRadius: theme.borders.radius.sm,
                        fontSize: theme.typography.fontSize.base,
                        background: theme.colors.bg,
                        color: theme.colors.textDark,
                      }}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="longitude" 
                      style={{ display: 'block', marginBottom: theme.spacing.xs, fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.typography.fontWeight.medium }}
                    >
                      Longitude
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      step="any"
                      placeholder="e.g., 15.4730"
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: `${theme.borders.width} solid ${theme.colors.border}`,
                        borderRadius: theme.borders.radius.sm,
                        fontSize: theme.typography.fontSize.base,
                        background: theme.colors.bg,
                        color: theme.colors.textDark,
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label 
                      htmlFor="altitude" 
                      style={{ display: 'block', marginBottom: theme.spacing.xs, fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.typography.fontWeight.medium }}
                    >
                      Altitude (meters)
                    </label>
                    <input
                      type="number"
                      id="altitude"
                      value={altitude}
                      onChange={(e) => setAltitude(e.target.value)}
                      step="any"
                      placeholder="e.g., 200 (optional with manual entry)"
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: `${theme.borders.width} solid ${theme.colors.border}`,
                        borderRadius: theme.borders.radius.sm,
                        fontSize: theme.typography.fontSize.base,
                        background: theme.colors.bg,
                        color: theme.colors.textDark,
                      }}
                    />
                    <p style={{ marginTop: theme.spacing.sm, fontSize: theme.typography.fontSize.xs, color: theme.colors.muted, marginBottom: 0 }}>
                      Note: Most browsers don't provide altitude data. You may need to enter it manually or use a separate altimeter.
                    </p>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label 
                      htmlFor="location_text" 
                      style={{ display: 'block', marginBottom: theme.spacing.xs, fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.typography.fontWeight.medium }}
                    >
                      Location (text)
                    </label>
                    <input
                      type="text"
                      id="location_text"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      placeholder="e.g., address"
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: `${theme.borders.width} solid ${theme.colors.border}`,
                        borderRadius: theme.borders.radius.sm,
                        fontSize: theme.typography.fontSize.base,
                        background: theme.colors.bg,
                        color: theme.colors.textDark,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: theme.spacing.lg }}>
                <Button variant='success' type='submit' disabled={submitting}>
                  {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Entry' : 'Create Entry')}
                </Button>
                
                <Button variant='outline' onClick={() => navigate(`/device/${id}`)}>Cancel</Button>
              </div>
            </div>
          </form>
        )}
      </section>
    </PageLayout>
  )
}
