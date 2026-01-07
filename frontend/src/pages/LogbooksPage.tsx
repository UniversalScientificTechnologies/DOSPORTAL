import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import logbookBg from '../assets/img/SPACEDOS01.jpg'

interface Detector {
  id: string
  name: string
  sn: string
  type: {
    name: string
    manufacturer: {
      name: string
    }
  }
}

export const LogbooksPage = ({
  apiBase,
  isAuthed,
}: {
  apiBase: string
  isAuthed: boolean
}) => {
  const navigate = useNavigate()
  const [detectors, setDetectors] = useState<Detector[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthed) return
    const fetchDetectors = async () => {
      try {
        const res = await fetch(`${apiBase}/detector/`, {
          method: 'GET',
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setDetectors(data)
      } catch (e: any) {
        setError(`Failed to load detectors: ${e.message}`)
      }
    }
    fetchDetectors()
  }, [apiBase, isAuthed])

  if (!isAuthed) {
    return (
      <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}>
        <div className="panel">
          <div style={{ color: '#dc3545', padding: '2rem' }}>
            Login required to view logbooks.
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}>
      <section className="panel">
        <header className="panel-header">
          <h2>Detector Logbooks</h2>
          <button 
            className="pill" 
            onClick={() => alert('QR code scanning for new logbook entry coming soon!')}
            style={{ background: '#198754', border: '1px solid #198754' }}
          >
            + Add Entry (QR)
          </button>
        </header>

        {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <div className="panel-body">
          {detectors.length === 0 ? (
            <p className="muted">No detectors available.</p>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '1.25rem',
              padding: '0.5rem 0'
            }}>
              {detectors.map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/logbook/${d.id}`)}
                  style={{
                    padding: '1.5rem',
                    background: '#ffffff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0d6efd'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,110,253,0.15)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', color: '#111827' }}>
                    {d.name}
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Type:</strong> {d.type?.name || 'N/A'}
                    </div>
                    <div>
                      <strong>Serial:</strong> {d.sn}
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '1rem', 
                    paddingTop: '0.75rem', 
                    borderTop: '1px solid #e5e7eb',
                    fontSize: '0.875rem',
                    color: '#0d6efd',
                    fontWeight: '500'
                  }}>
                    View Logbook →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
