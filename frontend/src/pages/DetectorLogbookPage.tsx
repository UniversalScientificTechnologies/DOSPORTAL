import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { CreateEntryButton } from '../components/CreateEntryButton'
import ReactMarkdown from 'react-markdown'
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
  getAuthHeader,
}: {
  apiBase: string
  isAuthed: boolean
  getAuthHeader: () => { Authorization?: string }
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
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
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
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
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
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
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
            <Link to="/logbooks" style={{ color: theme.colors.muted, textDecoration: 'none', fontSize: theme.typography.fontSize.sm }}>
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
          <CreateEntryButton to={`/logbook/${id}/create`} style={{ marginLeft: 12 }} />
        </header>

        {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {loading && <p className="muted">Loading logbook...</p>}

        {detector && (
          <div style={{ 
            background: '#f9fafb', 
            border: `${theme.borders.width} solid ${theme.colors.border}`, 
            borderRadius: theme.borders.radius.sm,
            padding: theme.spacing['2xl'],
            margin: `0 0 ${theme.spacing.lg} 0`
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
                <strong style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>Serial Number:</strong>
                <div style={{ marginTop: theme.spacing.xs }}>{detector.sn}</div>
              </div>
              <div>
                <strong style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>Type:</strong>
                <div style={{ marginTop: theme.spacing.xs }}>{detector.type?.name}</div>
              </div>
              <div>
                <strong style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>Manufacturer:</strong>
                <div style={{ marginTop: theme.spacing.xs }}>
                  {detector.type?.manufacturer?.url ? (
                    <a 
                      href={detector.type.manufacturer.url} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: theme.colors.primary, textDecoration: 'none' }}
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
                  <strong style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>Owner:</strong>
                  <div style={{ marginTop: theme.spacing.xs }}>{detector.owner.name}</div>
                </div>
              )}
              {detector.manufactured_date && (
                <div>
                  <strong style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>Manufactured:</strong>
                  <div style={{ marginTop: theme.spacing.xs }}>
                    {new Date(detector.manufactured_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="panel-body">
          <h3 style={{ marginTop: 0, marginBottom: theme.spacing.lg, fontSize: theme.typography.fontSize.base, color: theme.colors.textSecondary }}>
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
                    {item.location_text && (
                      <span style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>
                        📍 {item.location_text}
                      </span>
                    )}
                    {item.author?.username && (
                      <span style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}>
                        by @{item.author.username}
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/logbook/${id}/edit/${item.id}`)}
                      style={{
                        marginLeft: 'auto',
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        background: '#f3f4f6',
                        border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                        borderRadius: theme.borders.radius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        cursor: 'pointer',
                        color: theme.colors.textSecondary,
                        transition: theme.transitions.fast,
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text" style={{ marginTop: theme.spacing.md }}>
                    <ReactMarkdown>{item.text}</ReactMarkdown>
                  </div>
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
