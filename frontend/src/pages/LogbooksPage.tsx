import { useState, useEffect } from 'react'
import { PageLayout } from '../components/PageLayout'
import { DetectorCard } from '../components/DetectorCard'
import { Section } from '../components/Section'
import { CardGrid } from '../components/CardGrid'
import { EmptyState } from '../components/EmptyState'
import { theme } from '../theme'
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
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
            Login required to view logbooks.
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}>
      <Section title="Detector Logbooks">
        {error && <div className="error" style={{ marginBottom: theme.spacing.lg }}>{error}</div>}

        {detectors.length === 0 ? (
          <EmptyState message="No detectors available." />
        ) : (
          <CardGrid>
            {detectors.map((d) => (
              <DetectorCard key={d.id} detector={d} />
            ))}
          </CardGrid>
        )}
      </Section>
    </PageLayout>
  )
}
