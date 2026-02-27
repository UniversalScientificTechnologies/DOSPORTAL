import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Button } from '@/shared/components/Button/Button'
import { DetectorCard } from '@/components/DetectorCard'
import { Section } from '@/shared/components/Layout/Section'
import { CardGrid } from '@/components/CardGrid'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { SortableTable } from '@/shared/components/common/SortableTable'
import type { TableColumn } from '@/shared/components/common/SortableTable'
import { theme } from '@/theme'
import logbookBg from '@/assets/img/SPACEDOS01.jpg'
import { ViewToggle } from '@/organization/components/ViewToggle'
import type { ViewMode } from '@/organization/components/ViewToggle'
import { useDetectorsList } from '@/api/detectors/detectors'

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

export const LogbooksPage = () => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const detectorsQuery = useDetectorsList()
  const detectors = (detectorsQuery.data?.data?.results ?? []) as unknown as Detector[]
  const error = detectorsQuery.error ? String(detectorsQuery.error) : null
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

  return (
    <PageLayout backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}>
      <Section
        title='Detector Logbooks'
        actions={<Button variant='success' to="/device/create">+ Add Detector</Button>}
        error={error}
        >
        <ViewToggle value={viewMode} onChange={setViewMode} />

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
            onRowClick={(detector) => navigate(`/device/${detector.id}`)}
            defaultSortField="name"
            defaultSortDirection="asc"
            getRowKey={(detector) => detector.id}
            emptyMessage='No detectors available.'
          />
        )}
      </Section>
    </PageLayout>
  )
}
