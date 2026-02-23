import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { Section } from '../components/Section'
import { EmptyState } from '../components/EmptyState'
import { CreateEntryButton } from '../components/CreateEntryButton'
import { SortableTable } from '../components/SortableTable'
import type { TableColumn } from '../components/SortableTable'
import { theme } from '../theme'

type SpectralRecord = {
  id: string
  name: string
  processing_status: string
  created: string
  author: string | null
  owner: string | null
  raw_file_id: string | null
  artifacts_count: number
}

const PROCESSING_STATUS_LABELS: Record<string, string> = {
  'PENDING': 'Pending',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
  'FAILED': 'Failed',
}

const PROCESSING_STATUS_COLORS: Record<string, string> = {
  'PENDING': theme.colors.muted,
  'IN_PROGRESS': theme.colors.primary,
  'COMPLETED': theme.colors.success,
  'FAILED': theme.colors.danger,
}

export const LogsPage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string
  isAuthed: boolean
  getAuthHeader: () => { Authorization?: string }
}) => {
  const navigate = useNavigate()
  const [records, setRecords] = useState<SpectralRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const columns: TableColumn<SpectralRecord>[] = [
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
      id: 'processing_status',
      key: 'processing_status',
      label: 'Status',
      render: (value) => {
        const status = value as string
        const label = PROCESSING_STATUS_LABELS[status] || status
        const color = PROCESSING_STATUS_COLORS[status] || theme.colors.textSecondary
        return (
          <span style={{ color, fontWeight: theme.typography.fontWeight.medium }}>
            {label}
          </span>
        )
      },
    },
    {
      id: 'owner',
      key: 'owner',
      label: 'Owner',
      render: (value) => value ? String(value) : <span style={{ color: theme.colors.muted }}>—</span>,
    },
    {
      id: 'author',
      key: 'author',
      label: 'Author',
      render: (value) => value ? `@${String(value)}` : <span style={{ color: theme.colors.muted }}>—</span>,
    },
    {
      id: 'artifacts_count',
      key: 'artifacts_count',
      label: 'Artifacts',
      align: 'center',
      render: (value) => String(value || 0),
    },
    {
      id: 'created',
      key: 'created',
      label: 'Created',
      render: (value) => formatDate(value as string),
    },
  ]

  useEffect(() => {
    if (!isAuthed) {
      setLoading(false)
      return
    }
    
    const fetchRecords = async () => {
      try {
        const res = await fetch(`${apiBase}/spectral-record/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setRecords(data)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        setError(`Failed to load spectral records: ${message}`)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecords()
  }, [apiBase, isAuthed, getAuthHeader])

  if (!isAuthed) {
    return (
      <PageLayout>
        <div className="panel">
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
            Login required to view spectral records.
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
            <h2 style={{ margin: 0 }}>Spectral Records</h2>
            <CreateEntryButton to="/logs/upload" style={{ marginLeft: 'auto', minWidth: 160 }}>
              Upload File
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
            Loading spectral records...
          </div>
        ) : records.length === 0 ? (
          <EmptyState message="No spectral records available." />
        ) : (
          <SortableTable
            columns={columns}
            data={records}
            onRowClick={(record) => {
              navigate(`/spectral-record/${record.id}`)
            }}
            defaultSortField="created"
            defaultSortDirection="desc"
            getRowKey={(record) => record.id}
          />
        )}
      </Section>
    </PageLayout>
  )
}
