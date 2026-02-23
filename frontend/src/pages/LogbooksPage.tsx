import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { CreateEntryButton } from '../components/CreateEntryButton'
import { DetectorCard } from '../components/DetectorCard'
import { Section } from '../components/Section'
import { CardGrid } from '../components/CardGrid'
import { EmptyState } from '../components/EmptyState'
import { SortableTable } from '../components/SortableTable'
import type { TableColumn } from '../components/SortableTable'
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

type ViewMode = 'cards' | 'table'

export const LogbooksPage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string
  isAuthed: boolean
  getAuthHeader: () => { Authorization?: string }
}) => {
  const navigate = useNavigate()
  const [detectors, setDetectors] = useState<Detector[]>([])
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const columns: TableColumn<Detector>[] = [
    {
      id: 'name',
      key: 'name',
      label: 'Name',
      render: (value) => (
        <span style={{
          color: theme.colors.primary,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          {String(value)}
        </span>
      ),
    },
    {
      id: 'sn',
      key: 'sn',
      label: 'Serial Number',
    },
    {
      id: 'type',
      key: 'type',
      label: 'Type',
      render: (value) => {
        const type = value as { name: string }
        return type.name
      },
    },
    {
      id: 'manufacturer',
      key: 'type',
      label: 'Manufacturer',
      sortable: false,
      render: (value) => {
        const type = value as { manufacturer: { name: string } }
        return type.manufacturer.name
      },
    },
  ]

  useEffect(() => {
    if (!isAuthed) return
    const fetchDetectors = async () => {
      try {
        const res = await fetch(`${apiBase}/detector/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setDetectors(data)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        setError(`Failed to load detectors: ${message}`)
      }
    }
    fetchDetectors()
  }, [apiBase, isAuthed, getAuthHeader])

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
      <Section
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <h2 style={{ margin: 0 }}>Detector Logbooks</h2>
            <CreateEntryButton to="/detector/create" style={{ marginLeft: 'auto', minWidth: 160 }}>
              + Add Detector
            </CreateEntryButton>
          </div>
        }
      >
        {error && <div className="error" style={{ marginBottom: theme.spacing.lg }}>{error}</div>}

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.xl,
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.infoBg,
          borderRadius: theme.borders.radius.sm,
          width: 'fit-content',
        }}>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: viewMode === 'cards' ? theme.colors.primary : 'transparent',
              color: viewMode === 'cards' ? theme.colors.bg : theme.colors.textSecondary,
              border: 'none',
              borderRadius: theme.borders.radius.sm,
              cursor: 'pointer',
              fontWeight: theme.typography.fontWeight.medium,
              fontSize: theme.typography.fontSize.sm,
              transition: theme.transitions.fast,
            }}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: viewMode === 'table' ? theme.colors.primary : 'transparent',
              color: viewMode === 'table' ? theme.colors.bg : theme.colors.textSecondary,
              border: 'none',
              borderRadius: theme.borders.radius.sm,
              cursor: 'pointer',
              fontWeight: theme.typography.fontWeight.medium,
              fontSize: theme.typography.fontSize.sm,
              transition: theme.transitions.fast,
            }}
          >
            Table
          </button>
        </div>

        {detectors.length === 0 ? (
          <EmptyState message="No detectors available." />
        ) : viewMode === 'cards' ? (
          <CardGrid>
            {detectors.map((d) => (
              <DetectorCard key={d.id} detector={d} />
            ))}
          </CardGrid>
        ) : (
          <SortableTable
            columns={columns}
            data={detectors}
            onRowClick={(detector) => navigate(`/logbook/${detector.id}`)}
            defaultSortField="name"
            defaultSortDirection="asc"
            getRowKey={(detector) => detector.id}
          />
        )}
      </Section>
    </PageLayout>
  )
}
