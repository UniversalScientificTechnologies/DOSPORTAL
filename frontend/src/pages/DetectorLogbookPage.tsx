import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { theme } from '../theme'
import type { LogbookItem } from '../types'
import logbookBg from '../assets/img/SPACEDOS01.jpg'

interface Detector {
  id: string
  name: string
  sn: string
  type: {
    name: string
    manufacturer: {
      name: string
      url?: string
    }
    url?: string
    description?: string
  }
  owner?: {
    id: string
    name: string
    slug: string
  }
  manufactured_date?: string
  data?: any
}

export const DetectorLogbookPage = ({
  apiBase,
  isAuthed,
}: {
  apiBase: string
  isAuthed: boolean
}) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detector, setDetector] = useState<Detector | null>(null)
  const [logbook, setLogbook] = useState<LogbookItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !isAuthed) return

    const fetchDetectorAndLogbook = async () => {
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

        // Fetch logbook entries
        const logbookRes = await fetch(`${apiBase}/logbook/?detector=${id}`, {
          method: 'GET',
          credentials: 'include',
        })
        if (!logbookRes.ok) throw new Error(`HTTP ${logbookRes.status}`)
        const logbookData = await logbookRes.json()
        setLogbook(logbookData)
      } catch (e: any) {
        setError(`Failed to load detector logbook: ${e.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchDetectorAndLogbook()
  }, [id, apiBase, isAuthed])

  if (!isAuthed) {
    return (
      <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}>
        <div className="panel">
          <div style={{ color: '#dc3545', padding: '2rem' }}>
            Login required to view logbook.
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
            <Link to="/logbooks" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.9rem' }}>
              ← Back to Detectors
            </Link>
            {detector ? (
              <>
                <h2 style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>{detector.name}</h2>
              </>
            ) : (
              <h2>Detector Logbook</h2>
            )}
          </div>
          <button 
            className="pill" 
            onClick={() => navigate(`/logbook/${id}/create`)}
            style={{ background: '#198754', border: '1px solid #198754' }}
          >
            + Create Entry
          </button>
        </header>

        {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {loading && <p className="muted">Loading logbook...</p>}

        {detector && (
          <div style={{ 
            background: '#f9fafb', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            padding: '1.5rem',
            margin: '0 0 1.25rem 0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <h3 style={{ margin: 0, fontSize: theme.typography.fontSize.base, color: theme.colors.textSecondary }}>
                Detector Information
              </h3>
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = `${apiBase}/detector/${detector.id}/qr/?label=true`
                  link.download = `detector_${detector.sn}_qr.png`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  background: theme.colors.bg,
                  color: theme.colors.primary,
                  border: `${theme.borders.width} solid ${theme.colors.primary}`,
                  borderRadius: theme.borders.radius.sm,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: theme.transitions.fast,
                }}
              >
                QR
              </button>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem'
            }}>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '0.875rem' }}>Serial Number:</strong>
                <div style={{ marginTop: '0.25rem' }}>{detector.sn}</div>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '0.875rem' }}>Type:</strong>
                <div style={{ marginTop: '0.25rem' }}>{detector.type?.name}</div>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '0.875rem' }}>Manufacturer:</strong>
                <div style={{ marginTop: '0.25rem' }}>
                  {detector.type?.manufacturer?.url ? (
                    <a 
                      href={detector.type.manufacturer.url} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: '#0d6efd', textDecoration: 'none' }}
                    >
                      {detector.type.manufacturer.name}
                    </a>
                  ) : (
                    detector.type?.manufacturer?.name
                  )}
                </div>
              </div>
              {detector.owner && (
                <div>
                  <strong style={{ color: '#6b7280', fontSize: '0.875rem' }}>Owner:</strong>
                  <div style={{ marginTop: '0.25rem' }}>{detector.owner.name}</div>
                </div>
              )}
              {detector.manufactured_date && (
                <div>
                  <strong style={{ color: '#6b7280', fontSize: '0.875rem' }}>Manufactured:</strong>
                  <div style={{ marginTop: '0.25rem' }}>
                    {new Date(detector.manufactured_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="panel-body">
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', color: '#374151' }}>
            Logbook Entries
          </h3>
          {logbook.length === 0 && !loading ? (
            <p className="muted">No logbook entries yet.</p>
          ) : (
            <ul className="logbook-list">
              {logbook.map((item) => (
                <li key={item.id} className="logbook-item">
                  <div className="meta">
                    <span className="badge">{item.entry_type}</span>
                    <time>{new Date(item.created).toLocaleString()}</time>
                    {item.author?.username && (
                      <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                        by @{item.author.username}
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/logbook/${id}/edit/${item.id}`)}
                      style={{
                        marginLeft: 'auto',
                        padding: '0.25rem 0.5rem',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        color: '#374151',
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text">{item.text}</p>
                  {item.modified && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                      Last modified: {new Date(item.modified).toLocaleString()}
                      {item.modified_by?.username && (
                        <span> by @{item.modified_by.username}</span>
                      )}
                    </div>
                  )}
                  {item.latitude && item.longitude ? (
                    <a
                      className="maplink"
                      href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on map
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
