import { useState, useEffect } from 'react'
import { PageLayout } from '../components/PageLayout'
import { DetectorCard } from '../components/DetectorCard'
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
                <DetectorCard key={d.id} detector={d} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
