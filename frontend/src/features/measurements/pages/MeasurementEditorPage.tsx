import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WidePageLayout } from '@/shared/components/Layout/WidePageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { Button } from '@/shared/components/Button/Button'
import { AppToast } from '@/shared/components/common/AppToast'
import type { ToastState } from '@/shared/components/common/AppToast'
import { OrderableTable } from '@/shared/components/OrderableTable'
import type { OrderableTableColumn } from '@/shared/components/OrderableTable'
import { theme } from '@/theme'
import { EvolutionEditorChart } from '../components/EvolutionEditorChart'
import { RecordSelectorModal } from '../components/RecordSelectorModal'
import type { RecordOption } from '../components/RecordSelectorModal'
import type { SegmentMark } from '../components/EvolutionEditorChart'
import { useSpectralRecordsEvolutionRetrieve, useSpectralRecordsList } from '@/api/spectral-records/spectral-records'
import {
  useMeasurementSegmentsList,
  useMeasurementSegmentsCreate,
  useMeasurementSegmentsPartialUpdate,
  useMeasurementSegmentsDestroy,
  useMeasurementsFinalizeCreate,
} from '@/api/measurements/measurements'
import type { EvolutionData } from '@/shared/components/common/ChartsView'
import { EmptyState } from '@/shared/components/common/EmptyState'

// ---- types ----

type PanelRecord = RecordOption & { position: number }

type Segment = {
  localId: string
  serverId: string
  spectralRecordId: string
  spectralRecordName: string
  fromMs: number
  toMs: number
  position: number
}

// ---- helpers ----

let _localCounter = 0
const newLocalId = () => `local-${++_localCounter}`

const msToIso = (recordTimeStart: string, offsetMs: number) =>
  new Date(new Date(recordTimeStart).getTime() + offsetMs).toISOString()

const isoToMs = (recordTimeStart: string, iso: string) =>
  new Date(iso).getTime() - new Date(recordTimeStart).getTime()

const formatMs = (ms: number) => {
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

// ---- column definitions ----

const recordColumns: OrderableTableColumn<PanelRecord>[] = [
  {
    id: 'name',
    key: 'name',
    label: 'Name',
    render: (v) => (
      <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{String(v)}</span>
    ),
  },
  {
    id: 'owner',
    key: 'owner',
    label: 'Owner',
    render: (v) => (
      <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.muted }}>
        {v ? String(v) : '—'}
      </span>
    ),
  },
]

const segmentColumns: OrderableTableColumn<Segment>[] = [
  {
    id: 'position',
    key: 'position',
    label: '#',
    align: 'center',
  },
  {
    id: 'record',
    key: 'spectralRecordName',
    label: 'Record',
    render: (v) => (
      <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{String(v)}</span>
    ),
  },
  {
    id: 'range',
    key: 'fromMs',
    label: 'Range',
    render: (_, row) => (
      <span style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.xs }}>
        {formatMs(row.fromMs)} → {formatMs(row.toMs)}
      </span>
    ),
  },
]

// ---- Active record chart loader ----

function RecordEvolutionLoader({
  record,
  allSegments,
  pendingRange,
  highlightedLocalId,
  onBrushEnd,
}: {
  record: PanelRecord
  allSegments: Segment[]
  pendingRange?: { fromMs: number; toMs: number } | null
  highlightedLocalId?: string | null
  onBrushEnd: (fromMs: number, toMs: number) => void
}) {
  const evolutionQuery = useSpectralRecordsEvolutionRetrieve(record.id)
  const evolutionData = evolutionQuery.data?.data as unknown as EvolutionData | null

  // Global indices: position in the full segments array
  const segmentMarks: SegmentMark[] = allSegments
    .map((s, globalIdx) => ({ s, globalIdx }))
    .filter(({ s }) => s.spectralRecordId === record.id)
    .map(({ s, globalIdx }) => ({
      id: s.serverId,
      fromMs: s.fromMs,
      toMs: s.toMs,
      label: `#${globalIdx + 1}`,
    }))

  const highlighted = highlightedLocalId
    ? allSegments.find((s) => s.localId === highlightedLocalId)
    : null
  const highlightedRange = highlighted
    ? { fromMs: highlighted.fromMs, toMs: highlighted.toMs }
    : null

  if (evolutionQuery.isLoading) {
    return (
      <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
        Loading evolution data…
      </div>
    )
  }
  if (evolutionQuery.isError || !evolutionData) {
    return (
      <div style={{ padding: theme.spacing.xl, color: theme.colors.danger }}>
        Failed to load chart data.
      </div>
    )
  }

  return (
    <EvolutionEditorChart
      evolutionData={evolutionData}
      segments={segmentMarks}
      pendingRange={pendingRange}
      highlightedRange={highlightedRange}
      onBrushEnd={onBrushEnd}
    />
  )
}

// ---- Main page ----

export const MeasurementEditorPage = () => {
  const { id: measurementId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [panelRecords, setPanelRecords] = useState<PanelRecord[]>([])
  const [activeRecord, setActiveRecord] = useState<PanelRecord | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [activeSegmentLocalId, setActiveSegmentLocalId] = useState<string | null>(null)
  const [pendingRange, setPendingRange] = useState<{ fromMs: number; toMs: number } | null>(null)
  const [pendingSaving, setPendingSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [initialised, setInitialised] = useState(false)

  const segmentsQuery = useMeasurementSegmentsList(
    { measurement: measurementId } as Parameters<typeof useMeasurementSegmentsList>[0],
    { query: { enabled: !!measurementId } },
  )

  const spectralRecordsQuery = useSpectralRecordsList({ processing_status: 'completed' })

  useEffect(() => {
    if (initialised) return
    if (!segmentsQuery.data || !spectralRecordsQuery.data) return

    const apiSegments = segmentsQuery.data.data.results ?? []
    if (apiSegments.length === 0) {
      setInitialised(true)
      return
    }

    const allSpectralRecords = spectralRecordsQuery.data.data.results ?? []
    const recordById = new Map(allSpectralRecords.map((r) => [r.id, r]))

    // Build unique PanelRecords from the segments' spectral_record IDs
    const seenRecordIds = new Set<string>()
    const loadedPanelRecords: PanelRecord[] = []
    apiSegments.forEach((seg) => {
      if (!seenRecordIds.has(seg.spectral_record)) {
        seenRecordIds.add(seg.spectral_record)
        const rec = recordById.get(seg.spectral_record)
        if (rec) {
          loadedPanelRecords.push({
            id: rec.id,
            name: rec.name ?? '',
            owner: (rec.owner as { name?: string } | null)?.name ?? null,
            time_start: rec.time_start ?? null,
            record_duration: rec.record_duration ? Number(rec.record_duration) : null,
            position: loadedPanelRecords.length + 1,
          })
        }
      }
    })

    // Build Segment list (sorted by position)
    const sorted = [...apiSegments].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    const loadedSegments: Segment[] = sorted.flatMap((seg, idx) => {
      const rec = recordById.get(seg.spectral_record)
      if (!rec || !rec.time_start || !seg.time_from || !seg.time_to) return []
      return [{
        localId: newLocalId(),
        serverId: seg.id,
        spectralRecordId: seg.spectral_record,
        spectralRecordName: rec.name ?? '',
        fromMs: isoToMs(rec.time_start, seg.time_from),
        toMs: isoToMs(rec.time_start, seg.time_to),
        position: seg.position ?? idx + 1,
      }]
    })

    setPanelRecords(loadedPanelRecords)
    setSegments(loadedSegments)
    setInitialised(true)
  }, [segmentsQuery.data, spectralRecordsQuery.data, initialised])

  const createSegment = useMeasurementSegmentsCreate()
  const patchSegment = useMeasurementSegmentsPartialUpdate()
  const destroySegment = useMeasurementSegmentsDestroy()
  const finalizeMeasurement = useMeasurementsFinalizeCreate()

  const currentIds = new Set(panelRecords.map((r) => r.id))

  const showToast = (message: string, variant: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 3500)
  }

  // ---- record panel ----

  const handleAddRecords = useCallback((records: RecordOption[]) => {
    setPanelRecords((prev) => {
      const existing = new Set(prev.map((r) => r.id))
      const newOnes = records.filter((r) => !existing.has(r.id))
      return [...prev, ...newOnes.map((r, i) => ({ ...r, position: prev.length + i + 1 }))]
    })
    setActiveRecord((prev) => {
      if (prev) return prev
      const first = records[0]
      return first ? { ...first, position: 1 } : null
    })
  }, [])

  const handleRemoveRecord = (row: PanelRecord) => {
    setPanelRecords((prev) => prev.filter((r) => r.id !== row.id))
    if (activeRecord?.id === row.id) setActiveRecord(null)
  }

  // ---- brush range → pending ----

  const handleBrushEnd = useCallback((fromMs: number, toMs: number) => {
    if (!activeRecord || !measurementId) return
    setPendingRange({ fromMs, toMs })
  }, [activeRecord, measurementId])

  // ---- add segment (immediate API save) ----

  const handleAddPending = async () => {
    if (!pendingRange || !activeRecord || !measurementId) return
    setPendingSaving(true)
    try {
      const timeStart = activeRecord.time_start ?? null
      const timeFrom = timeStart ? msToIso(timeStart, pendingRange.fromMs) : null
      const timeTo = timeStart ? msToIso(timeStart, pendingRange.toMs) : null
      const position = segments.length + 1
      const result = await createSegment.mutateAsync({
        data: {
          measurement: measurementId,
          spectral_record: activeRecord.id,
          time_from: timeFrom,
          time_to: timeTo,
          position,
        },
      })
      const saved = result.data as unknown as { id: string }
      setSegments((prev) => [
        ...prev,
        {
          localId: newLocalId(),
          serverId: saved.id,
          spectralRecordId: activeRecord.id,
          spectralRecordName: activeRecord.name,
          fromMs: pendingRange.fromMs,
          toMs: pendingRange.toMs,
          position,
        },
      ])
      setPendingRange(null)
      showToast('Segment saved', 'success')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save segment', 'error')
    } finally {
      setPendingSaving(false)
    }
  }

  // ---- delete segment ----

  const handleDeleteSegment = async (seg: Segment) => {
    try {
      await destroySegment.mutateAsync({ id: seg.serverId })
      setSegments((prev) => prev.filter((s) => s.localId !== seg.localId))
      showToast('Segment deleted', 'info')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to delete segment', 'error')
    }
  }

  // ---- reorder segments (sync positions to server) ----

  const handleSegmentsReorder = async (reordered: Segment[]) => {
    setSegments(reordered)
    try {
      await Promise.all(
        reordered.map((seg) =>
          patchSegment.mutateAsync({ id: seg.serverId, data: { position: seg.position } }),
        ),
      )
      showToast('Order updated', 'success')
    } catch {
      showToast('Failed to update segment order', 'error')
    }
  }

  // ---- finalize ----

  const handleFinalize = async () => {
    if (!measurementId) return
    setFinalizing(true)
    try {
      await finalizeMeasurement.mutateAsync({ id: measurementId, data: { name: '' } })
      navigate(`/measurement/status/${measurementId}`)
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to finalize', 'error')
    } finally {
      setFinalizing(false)
    }
  }

  // ---- render ----

  const isLoading = segmentsQuery.isLoading || spectralRecordsQuery.isLoading

  return (
    <WidePageLayout>
      <AppToast toast={toast} />
      <Section
        title="Measurement Editor"
        actions={
          <Button onClick={handleFinalize} disabled={finalizing || segments.length === 0}>
            {finalizing ? 'Finalizing…' : 'Finalize Measurement'}
          </Button>
        }
      >
        {/* Row 1: Records + Segments */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>

          {/* Records panel */}
          <Section title="Records" actions={
            <Button size="sm" variant="secondary" onClick={() => setShowModal(true)} disabled={isLoading}>+ Add Records</Button>
          }>
            {isLoading ? (
              <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
                Loading…
              </div>
            ) : (
            <OrderableTable
              columns={recordColumns}
              items={panelRecords}
              onItemsChange={setPanelRecords}
              selectedKey={activeRecord?.id}
              onSelectRow={(row) => { setActiveRecord(row); setPendingRange(null); setActiveSegmentLocalId(null) }}
              onDeleteRow={handleRemoveRecord}
              getRowKey={(row) => row.id}
              emptyMessage="No records added yet."
            />
            )}
          </Section>

          {/* Segments panel */}
          <Section title={`Segments (${segments.length})`}>
            {pendingRange && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: theme.spacing.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                border: `2px dashed ${theme.colors.warning}`,
                borderRadius: theme.borders.radius.sm,
                backgroundColor: theme.colors.warningBg,
                fontSize: theme.typography.fontSize.sm,
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: theme.typography.fontWeight.medium }}>Pending: </span>
                  {formatMs(pendingRange.fromMs)} → {formatMs(pendingRange.toMs)}
                  {activeRecord && (
                    <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.muted }}>
                      {activeRecord.name}
                    </div>
                  )}
                </div>
                <Button size="sm" onClick={handleAddPending} disabled={pendingSaving}>
                  {pendingSaving ? 'Saving…' : 'Add Segment'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingRange(null)}>✕</Button>
              </div>
            )}
            <OrderableTable
              columns={segmentColumns}
              items={segments}
              onItemsChange={handleSegmentsReorder}
              selectedKey={activeSegmentLocalId ?? undefined}
              onSelectRow={(row) => {
                setActiveSegmentLocalId((id) => (id === row.localId ? null : row.localId))
                const rec = panelRecords.find((r) => r.id === row.spectralRecordId)
                if (rec) { setActiveRecord(rec); setPendingRange(null) }
              }}
              onDeleteRow={handleDeleteSegment}
              getRowKey={(row) => row.localId}
              emptyMessage="No segments yet. Select a range on the chart below."
            />
          </Section>
        </div>

        {/* Row 2: Chart (full width) */}
        <div>
          {!activeRecord ? (
            <EmptyState message='Select a record from the panel above to view its chart.' style={{textAlign: 'center'}}/>
          ) : (
            <Section title={`Chart: ${activeRecord.name}`} subtitle='Use the Horrizontally Select tool in the toolbar to select a time range, then click Add Segment.'>
              <RecordEvolutionLoader
                record={activeRecord}
                allSegments={segments}
                pendingRange={pendingRange}
                highlightedLocalId={activeSegmentLocalId}
                onBrushEnd={handleBrushEnd}
              />
            </Section>
          )}
        </div>
      </Section>

      {showModal && (
        <RecordSelectorModal
          currentIds={currentIds}
          onClose={() => setShowModal(false)}
          onAdd={handleAddRecords}
        />
      )}
    </WidePageLayout>
  )
}
