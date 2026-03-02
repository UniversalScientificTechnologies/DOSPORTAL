import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { Button } from '@/shared/components/Button/Button'
import { SortableTable } from '@/shared/components/common/SortableTable'
import type { TableColumn } from '@/shared/components/common/SortableTable'
import { theme } from '@/theme'
import { useSpectralRecordsList } from '@/api/spectral-records/spectral-records'
import type { SpectralRecord } from '@/api/model'
import { formatDate } from '@/shared/utils/formatDate'

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

export const LogsPage = () => {
  const navigate = useNavigate()
  const recordsQuery = useSpectralRecordsList()
  const records: SpectralRecord[] = recordsQuery.data?.data?.results ?? []
  const loading = recordsQuery.isLoading
  const error = recordsQuery.error ? `Failed to load spectral records: ${(recordsQuery.error as Error).message}` : null

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
      render: (_value, row) => row.owner?.name ? row.owner.name : <span style={{ color: theme.colors.muted }}>—</span>,
    },
    {
      id: 'author',
      key: 'author',
      label: 'Author',
      render: (_value, row) => row.author?.username ? `@${row.author.username}` : <span style={{ color: theme.colors.muted }}>—</span>,
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

  return (
    <PageLayout>
      <Section 
        title='Spectral Records'
        actions={<Button variant='success' to="/logs/upload">Upload File</Button>}
        error={error}
      >
        {loading ? (
          <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
            Loading spectral records...
          </div>
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
            emptyMessage="No spectral records available."
          />
        )}
      </Section>
    </PageLayout>
  )
}
