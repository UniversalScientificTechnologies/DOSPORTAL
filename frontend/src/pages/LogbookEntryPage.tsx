import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import logbookBg from '../assets/img/SPACEDOS01.jpg'

interface Detector {
  id: string
  name: string
  sn: string
  type: {
    name: string
  }
}

export const LogbookEntryPage = ({
  apiBase,
  isAuthed,
}: {
  apiBase: string
  isAuthed: boolean
}) => {
  const { id, entryId } = useParams<{ id: string; entryId?: string }>()
  const navigate = useNavigate()
  const [detector, setDetector] = useState<Detector | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const isEditMode = !!entryId

  // Form fields
  const [text, setText] = useState('')
  const [entryType, setEntryType] = useState('note')
  const [isPublic, setIsPublic] = useState(true)
  const [source] = useState('web')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [altitude, setAltitude] = useState('')

  const entryTypeChoices = [
    { value: 'reset', label: 'Reset' },
    { value: 'sync', label: 'Sync' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'note', label: 'Note' },
    { value: 'location_update', label: 'Location update' },
    { value: 'calibration', label: 'Calibration' },
    { value: 'other', label: 'Other' },
  ]

  useEffect(() => {
    if (!id || !isAuthed) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch detector details
        const detectorRes = await fetch(`${apiBase}/detector/`, {
          method: 'GET',
          credentials: 'include',
        })
        if (!detectorRes.ok) throw new Error(`HTTP ${detectorRes.status}`)
        const detectors = await detectorRes.json()
        const foundDetector = detectors.find((d: Detector) => d.id === id)
        
        if (!foundDetector) {
          throw new Error('Detector not found')
        }
        setDetector(foundDetector)

        // If in edit mode, fetch the logbook entry
        if (isEditMode && entryId) {
          const logbookRes = await fetch(`${apiBase}/logbook/?detector=${id}`, {
            method: 'GET',
            credentials: 'include',
          })
          if (!logbookRes.ok) throw new Error(`HTTP ${logbookRes.status}`)
          const logbookData = await logbookRes.json()
          const entry = logbookData.find((e: any) => e.id === entryId)
          
          if (entry) {
            setText(entry.text || '')
            setEntryType(entry.entry_type || 'note')
            setIsPublic(entry.public ?? true)
            setLatitude(entry.latitude?.toString() || '')
            setLongitude(entry.longitude?.toString() || '')
            setAltitude(entry.altitude?.toString() || '')
          } else {
            throw new Error('Logbook entry not found')
          }
        }
      } catch (e: any) {
        setError(`Failed to load data: ${e.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, entryId, isEditMode, apiBase, isAuthed])

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()!.split(';').shift() || ''
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setSubmitting(true)
    setError(null)

    try {
      const payload: any = {
        detector: id,
        text,
        entry_type: entryType,
        public: isPublic,
        source,
      }

      // Add optional location fields if provided
      if (latitude) payload.latitude = parseFloat(latitude)
      if (longitude) payload.longitude = parseFloat(longitude)
      if (altitude) payload.altitude = parseFloat(altitude)

      const csrftoken = getCookie('csrftoken')

      const url = isEditMode 
        ? `${apiBase}/logbook/${entryId}/`
        : `${apiBase}/logbook/add/`
      
      const method = isEditMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken || '',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${res.status}`)
      }

      // Navigate back to the detector logbook page
      navigate(`/logbook/${id}`)
    } catch (e: any) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} entry: ${e.message}`)
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
          setError(`Failed to get location: ${error.message}`)
        }
      )
    } else {
      setError('Geolocation is not supported by your browser')
    }
  }

  if (!isAuthed) {
    return (
      <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}>
        <div className="panel">
          <div style={{ color: '#dc3545', padding: '2rem' }}>
            Login required to create logbook entry.
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}>
      <section className="panel">
        <header className="panel-header">
          <div>
            <Link 
              to={`/logbook/${id}`} 
              style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              ← Back to Logbook
            </Link>
            <h2 style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>
              {isEditMode ? 'Edit Logbook Entry' : 'Create Logbook Entry'}
            </h2>
            {detector && (
              <p className="muted">
                {detector.name} (TYPE: {detector.type?.name} · ID: {detector.id})
              </p>
            )}
          </div>
        </header>

        {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {loading && <p className="muted">Loading detector...</p>}

        {!loading && detector && (
          <form onSubmit={handleSubmit} className="panel-body">
            <div style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label 
                  htmlFor="entry_type" 
                  style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1f2937' }}
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
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    background: 'white',
                    color: '#1f2937',
                  }}
                >
                  {entryTypeChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label 
                  htmlFor="text" 
                  style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1f2937' }}
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
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    background: 'white',
                    color: '#1f2937',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Make this entry visible to everyone</span>
                </label>
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280', marginLeft: '26px' }}>
                  Private logbook will be visible for maintainers of detector and for dosportal admins.
                </p>
              </div>

              <div style={{ 
                background: 'white', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1f2937', fontWeight: '600' }}>
                    Location (Optional)
                  </h3>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#6b7280'}
                  >
                    📍 Get Current Location
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label 
                      htmlFor="latitude" 
                      style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}
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
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        background: 'white',
                        color: '#1f2937',
                      }}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="longitude" 
                      style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}
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
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        background: 'white',
                        color: '#1f2937',
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label 
                      htmlFor="altitude" 
                      style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}
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
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        background: 'white',
                        color: '#1f2937',
                      }}
                    />
                    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280', marginBottom: 0 }}>
                      Note: Most browsers don't provide altitude data. You may need to enter it manually or use a separate altimeter.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: submitting ? '#6c757d' : '#198754',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Entry' : 'Create Entry')}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/logbook/${id}`)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </PageLayout>
  )
}
