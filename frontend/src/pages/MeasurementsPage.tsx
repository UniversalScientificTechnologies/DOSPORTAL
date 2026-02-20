import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { Section } from '../components/Section'
import { EmptyState } from '../components/EmptyState'
import { CreateEntryButton } from '../components/CreateEntryButton'
import { SortableTable } from '../components/SortableTable'
import type { TableColumn } from '../components/SortableTable'
import { theme } from '../theme'
import type { Measurement } from '../types'

const MEASUREMENT_TYPE_LABELS: Record<string, string> = {
  D: 'Debug',
  S: 'Static',
  M: 'Mobile (ground)',
  C: 'Civil airborne',
  A: 'Special airborne',
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export const MeasurementsPage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string
  isAuthed: boolean
  getAuthHeader: () => { Authorization?: string }
}) => {
  const navigate = useNavigate()
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const columns: TableColumn<Measurement>[] = [
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
      id: 'measurement_type',
      key: 'measurement_type',
      label: 'Type',
      render: (value) => {
        const type = value as string
        return MEASUREMENT_TYPE_LABELS[type] || type
      },
    },
    {
      id: 'owner',
      key: 'owner',
      label: 'Owner',
      render: (value) => {
        const owner = value as { name: string } | null
        return owner?.name || <span style={{ color: theme.colors.muted }}>—</span>
      },
    },
    {
      id: 'time_created',
      key: 'time_created',
      label: 'Created',
      render: (value) => formatDate(value as string),
    },
    {
      id: 'public',
      key: 'public',
      label: 'Public',
      sortable: false,
      align: 'center',
      render: (value) =>
        value ? (
          <span style={{ color: theme.colors.success }}>✓</span>
        ) : (
          <span style={{ color: theme.colors.muted }}>—</span>
        ),
    },
  ]

  useEffect(() => {
    if (!isAuthed) {
      setLoading(false)
      return
    }
    
    const fetchMeasurements = async () => {
      try {
        const res = await fetch(`${apiBase}/measurement/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setMeasurements(data)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        setError(`Failed to load measurements: ${message}`)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMeasurements()
  }, [apiBase, isAuthed, getAuthHeader])

  if (!isAuthed) {
    return (
      <PageLayout>
        <div className="panel">
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
            Login required to view measurements.
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Section 
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <h2 style={{ margin: 0 }}>Measurements</h2>
            <CreateEntryButton to="/logs/upload" style={{ marginLeft: 'auto', minWidth: 160 }}>
              Create Measurement
            </CreateEntryButton>
          </div>
        }
      >
        {error && (
          <div style={{
            color: theme.colors.danger,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            backgroundColor: theme.colors.successBg,
            borderRadius: theme.borders.radius.sm,
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
            Loading measurements...
          </div>
        ) : measurements.length === 0 ? (
          <EmptyState message="No measurements available." />
        ) : (
          <SortableTable
            columns={columns}
            data={measurements}
            onRowClick={(measurement) => navigate(`/measurement/${measurement.id}`)}
            defaultSortField="time_created"
            defaultSortDirection="desc"
            getRowKey={(measurement) => measurement.id}
          />
        )}
      </Section>
    </PageLayout>
  )
}
