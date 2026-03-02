import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { Button } from '@/shared/components/Button/Button'
import { SortableTable } from '@/shared/components/common/SortableTable'
import type { TableColumn } from '@/shared/components/common/SortableTable'
import { theme } from '@/theme'
import { useMeasurementsList } from '@/api/measurements/measurements'
import type { Measurements } from '@/api/model'
import { formatDate } from '@/shared/utils/formatDate'

const MEASUREMENT_TYPE_LABELS: Record<string, string> = {
  D: 'Debug',
  S: 'Static',
  M: 'Mobile (ground)',
  C: 'Civil airborne',
  A: 'Special airborne',
}

export const MeasurementsPage = () => {
  const navigate = useNavigate()
  const measurementsQuery = useMeasurementsList()
  const measurements: Measurements[] = measurementsQuery.data?.data?.results ?? []
  const loading = measurementsQuery.isLoading
  const error = measurementsQuery.error
    ? `Failed to load measurements: ${(measurementsQuery.error as Error).message}`
    : null

  const columns: TableColumn<Measurements>[] = [
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

  return (
    <PageLayout>
      <Section
        title='Measurements'
        actions={<Button variant='success' to="/measurement/create">Create Measurement</Button>} 
        error={error}
      >
        {loading ? (
          <EmptyState message='Loading measurements...'/>
        ) : (
          <SortableTable
            columns={columns}
            data={measurements}
            onRowClick={(measurement) => navigate(`/measurement/${measurement.id}`)}
            defaultSortField="time_created"
            defaultSortDirection="desc"
            getRowKey={(measurement) => measurement.id}
            emptyMessage='No measurements available.'
          />
        )}
      </Section>
    </PageLayout>
  )
}
