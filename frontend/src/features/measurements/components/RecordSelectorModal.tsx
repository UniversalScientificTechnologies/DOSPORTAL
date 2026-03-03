import { useState, useMemo } from 'react'
import { Modal } from '@/shared/components/common/Modal'
import { theme } from '@/theme'
import { Button } from '@/shared/components/Button/Button'
import { useSpectralRecordsList } from '@/api/spectral-records/spectral-records'
import { formatDate } from '@/shared/utils/formatDate'

export type RecordOption = {
  id: string
  name: string
  owner: string | null
  time_start: string | null
  record_duration: number | null
}

type Props = {
  onClose: () => void
  onAdd: (records: RecordOption[]) => void
  /** IDs of records already in the editor – will be excluded from the list */
  currentIds?: Set<string>
}

export const RecordSelectorModal = ({ onClose, onAdd, currentIds = new Set() }: Props) => {
  const recordsQuery = useSpectralRecordsList({ processing_status: 'completed' })
  const allRecords: RecordOption[] = useMemo(
    () =>
      (recordsQuery.data?.data?.results ?? [])
        .filter((r) => !currentIds.has(r.id))
        .map((r) => ({
          id: r.id,
          name: r.name ?? '',
          owner: (r.owner as { name?: string } | null)?.name ?? null,
          time_start: r.time_start ?? null,
          record_duration: r.record_duration ? Number(r.record_duration) : null,
        })),
    [recordsQuery.data, currentIds],
  )

  const [search, setSearch] = useState('')
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(
    () =>
      search.trim()
        ? allRecords.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
        : allRecords,
    [allRecords, search],
  )

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = filtered.length > 0 && filtered.every((r) => checkedIds.has(r.id))
  const someChecked = filtered.some((r) => checkedIds.has(r.id))

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((r) => next.delete(r.id))
        return next
      })
    } else {
      setCheckedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((r) => next.add(r.id))
        return next
      })
    }
  }

  const handleAdd = () => {
    const toAdd = allRecords.filter((r) => checkedIds.has(r.id))
    onAdd(toAdd)
    onClose()
  }

  const rowStyle = (checked: boolean): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: '1.5rem 1fr auto auto',
    gap: theme.spacing.md,
    alignItems: 'center',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    borderBottom: `1px solid ${theme.colors.border}`,
    cursor: 'pointer',
    backgroundColor: checked ? theme.colors.infoBg : theme.colors.bg,
    fontSize: theme.typography.fontSize.sm,
  })

  return (
    <Modal title="Add Records" onClose={onClose} minWidth={680}>
      {/* Search */}
      <input
        type="text"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          border: `${theme.borders.width} solid ${theme.colors.border}`,
          borderRadius: theme.borders.radius.sm,
          fontSize: theme.typography.fontSize.sm,
          marginBottom: theme.spacing.md,
          boxSizing: 'border-box',
          outline: 'none',
          backgroundColor: theme.colors.bg,
          color: theme.colors.text,
          colorScheme: 'light',
        }}
      />

      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5rem 1fr auto auto',
        gap: theme.spacing.md,
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        borderBottom: `2px solid ${theme.colors.border}`,
        backgroundColor: '#f9fafb',
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.muted,
        userSelect: 'none',
      }}>
        <input
          type="checkbox"
          checked={allChecked}
          ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
          onChange={toggleAll}
          style={{ cursor: 'pointer', accentColor: theme.colors.primary, colorScheme: 'light' }}
        />
        <span>Name / Owner</span>
        <span>Start time</span>
        <span>Duration</span>
      </div>

      {/* List */}
      <div style={{ maxHeight: '380px', overflowY: 'auto', colorScheme: 'light' }}>
        {recordsQuery.isLoading && (
          <div style={{ padding: theme.spacing.xl, color: theme.colors.muted, textAlign: 'center' }}>
            Loading…
          </div>
        )}
        {!recordsQuery.isLoading && filtered.length === 0 && (
          <div style={{ padding: theme.spacing.xl, color: theme.colors.muted, textAlign: 'center', fontStyle: 'italic' }}>
            No records available.
          </div>
        )}
        {filtered.map((record) => {
          const checked = checkedIds.has(record.id)
          const durationMin = record.record_duration ? Math.round(record.record_duration / 60) : null
          return (
            <div key={record.id} style={rowStyle(checked)} onClick={() => toggleCheck(record.id)}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleCheck(record.id)}
                onClick={(e) => e.stopPropagation()}
                style={{ cursor: 'pointer', accentColor: theme.colors.primary, colorScheme: 'light' }}
              />
              <div>
                <div style={{ fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textDark }}>
                  {record.name}
                </div>
                {record.owner && (
                  <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.muted }}>
                    {record.owner}
                  </div>
                )}
              </div>
              <span style={{ color: theme.colors.muted, whiteSpace: 'nowrap' }}>
                {formatDate(record.time_start)}
              </span>
              <span style={{ color: theme.colors.muted, whiteSpace: 'nowrap' }}>
                {durationMin != null ? `${durationMin} min` : '—'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} disabled={checkedIds.size === 0}>
          Add {checkedIds.size > 0 ? `${checkedIds.size} ` : ''}record{checkedIds.size !== 1 ? 's' : ''}
        </Button>
      </div>
    </Modal>
  )
}
