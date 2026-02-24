import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { WidePageLayout } from '../components/WidePageLayout'
import { EmptyState } from '../components/EmptyState'
import { theme } from '../theme'
import { useAuthContext } from '../context/AuthContext'

type SpectralRecord = {
  id: string
  name: string
  created: string
  author: string | null
  owner: string | null
  raw_file_id: string | null
  artifacts_count: number
  time_start: string | null
  record_duration: number | null  // seconds
}

type SortField = keyof SpectralRecord
type SortDir = 'asc' | 'desc'

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

function sortRecords(records: SpectralRecord[], field: SortField, dir: SortDir): SpectralRecord[] {
  return [...records].sort((a, b) => {
    const aVal: unknown = a[field]
    const bVal: unknown = b[field]
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.toLowerCase() < bVal.toLowerCase() ? -1 : aVal.toLowerCase() > bVal.toLowerCase() ? 1 : 0
      return dir === 'asc' ? cmp : -cmp
    }
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return dir === 'asc' ? cmp : -cmp
  })
}

const buttonBase: React.CSSProperties = {
  padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
  borderRadius: theme.borders.radius.sm,
  border: `${theme.borders.width} solid transparent`,
  fontWeight: theme.typography.fontWeight.medium,
  fontSize: theme.typography.fontSize.sm,
  cursor: 'pointer',
  transition: `background ${theme.transitions.fast}`,
}

// --- Custom checkbox ---
function Checkbox({ checked, indeterminate, onChange, onClick, title }: {
  checked?: boolean
  indeterminate?: boolean
  onChange?: () => void
  onClick?: (e: React.MouseEvent) => void
  title?: string
}) {
  const box: React.CSSProperties = {
    flexShrink: 0,
    width: '1.1rem',
    height: '1.1rem',
    border: `2px solid ${checked || indeterminate ? theme.colors.primary : theme.colors.mutedLight}`,
    borderRadius: '3px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.primary,
    fontSize: '0.8rem',
    lineHeight: 1,
    userSelect: 'none',
    transition: `border-color ${theme.transitions.fast}`,
  }
  return (
    <div
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      title={title}
      style={box}
      onClick={(e) => { onClick?.(e); onChange?.() }}
    >
      {indeterminate ? '−' : checked ? '✓' : ''}
    </div>
  )
}

// --- Sub-components ---

interface RecordRowProps {
  record: SpectralRecord
  side: 'left' | 'right'
  checked?: boolean
  onCheck?: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string, from: 'left' | 'right') => void
  onRemove?: (id: string) => void
}

function RecordRow({ record, side, checked, onCheck, onDragStart, onRemove }: RecordRowProps) {
  const [hovered, setHovered] = useState(false)

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    borderBottom: `1px solid ${theme.colors.border}`,
    cursor: 'grab',
    backgroundColor: hovered ? theme.colors.infoBg : theme.colors.bg,
    transition: `background ${theme.transitions.fast}`,
    userSelect: 'none',
  }

  return (
    <div
      style={rowStyle}
      draggable
      onDragStart={(e) => onDragStart(e, record.id, side)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (side === 'left' && onCheck) onCheck(record.id) }}
    >
      {/* drag handle */}
      <span
        title="Drag to move"
        style={{ color: theme.colors.mutedLight, fontSize: '0.85rem', flexShrink: 0, cursor: 'grab' }}
      >
        ⠿
      </span>

      {side === 'left' && onCheck && (
        <Checkbox
          checked={checked}
          onChange={() => onCheck(record.id)}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Name */}
      <span style={{ flex: '0 0 28%', color: theme.colors.textSecondary, fontWeight: theme.typography.fontWeight.medium, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {record.name}
      </span>

      {/* Owner */}
      <span style={{ flex: '0 0 16%', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {record.owner || <span style={{ color: theme.colors.mutedLight }}>—</span>}
      </span>

      {/* Author */}
      <span style={{ flex: '0 0 16%', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {record.author ? `@${record.author}` : <span style={{ color: theme.colors.mutedLight }}>—</span>}
      </span>

      {/* Created */}
      <span style={{ flex: 1, color: theme.colors.muted, fontSize: theme.typography.fontSize.sm, whiteSpace: 'nowrap' }}>
        {formatDate(record.created)}
      </span>

      {side === 'right' && onRemove && (
        <button
          title="Remove from selection"
          onClick={(e) => { e.stopPropagation(); onRemove(record.id) }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: theme.colors.danger,
            fontSize: '1.1rem',
            lineHeight: 1,
            padding: `0 ${theme.spacing.xs}`,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

// --- Column header row ---
interface ColHeadersProps {
  sortField: SortField
  sortDir: SortDir
  onSort: (key: SortField) => void
  showCheckbox?: boolean
  allChecked?: boolean
  someChecked?: boolean
  onToggleAll?: () => void
}

function ColHeaders({ sortField, sortDir, onSort, showCheckbox, allChecked, someChecked, onToggleAll }: ColHeadersProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      borderBottom: `1px solid ${theme.colors.border}`,
      backgroundColor: '#f9fafb',
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.muted,
      userSelect: 'none',
    }}>
      {/* drag handle placeholder */}
      <span style={{ width: '0.6rem', flexShrink: 0 }} />

      {showCheckbox && (
        <Checkbox
          checked={allChecked}
          indeterminate={someChecked && !allChecked}
          onChange={onToggleAll}
          title="Select all"
        />
      )}

      <span
        style={{ flex: '0 0 28%', cursor: 'pointer', fontWeight: theme.typography.fontWeight.semibold }}
        onClick={() => onSort('name')}
      >
        Name {sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </span>
      <span
        style={{ flex: '0 0 16%', cursor: 'pointer', fontWeight: theme.typography.fontWeight.semibold }}
        onClick={() => onSort('owner')}
      >
        Owner {sortField === 'owner' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </span>
      <span
        style={{ flex: '0 0 16%', cursor: 'pointer', fontWeight: theme.typography.fontWeight.semibold }}
        onClick={() => onSort('author')}
      >
        Author {sortField === 'author' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </span>
      <span
        style={{ flex: 1, cursor: 'pointer', fontWeight: theme.typography.fontWeight.semibold }}
        onClick={() => onSort('created')}
      >
        Created {sortField === 'created' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </span>
    </div>
  )
}

// --- Main Page ---

export const RecordSelectorPage = () => {
  const { API_BASE: apiBase, getAuthHeader } = useAuthContext()
  const navigate = useNavigate()

  const [allRecords, setAllRecords] = useState<SpectralRecord[]>([])
  const [selected, setSelected] = useState<SpectralRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Left panel sort
  const [leftSortField, setLeftSortField] = useState<SortField>('created')
  const [leftSortDir, setLeftSortDir] = useState<SortDir>('desc')

  // Right panel sort
  const [rightSortField, setRightSortField] = useState<SortField>('created')
  const [rightSortDir, setRightSortDir] = useState<SortDir>('desc')

  // Checkboxes on left
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  // Drag state
  const [leftDragOver, setLeftDragOver] = useState(false)
  const [rightDragOver, setRightDragOver] = useState(false)
  const dragPayload = useRef<{ id: string; from: 'left' | 'right' } | null>(null)

  // Missing raw file tooltip
  const [showUploadTooltip, setShowUploadTooltip] = useState(false)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${apiBase}/spectral-record/?processing_status=completed`, {
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: SpectralRecord[] = await res.json()
        setAllRecords(data)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [apiBase, getAuthHeader])

  // Records visible on the left (all minus already selected)
  const selectedIds = new Set(selected.map((r) => r.id))
  const leftRecords = sortRecords(
    allRecords.filter((r) => !selectedIds.has(r.id)),
    leftSortField,
    leftSortDir,
  )
  const rightRecords = sortRecords(selected, rightSortField, rightSortDir)

  // ---- Sort handlers ----
  const handleLeftSort = (field: SortField) => {
    if (leftSortField === field) setLeftSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setLeftSortField(field); setLeftSortDir('asc') }
  }
  const handleRightSort = (field: SortField) => {
    if (rightSortField === field) setRightSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setRightSortField(field); setRightSortDir('asc') }
  }

  // ---- Checkbox handlers ----
  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const leftIds = new Set(leftRecords.map((r) => r.id))
  const allChecked = leftIds.size > 0 && [...leftIds].every((id) => checkedIds.has(id))
  const someChecked = [...leftIds].some((id) => checkedIds.has(id))

  const toggleAllCheck = () => {
    if (allChecked) {
      setCheckedIds((prev) => {
        const next = new Set(prev)
        leftIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setCheckedIds((prev) => {
        const next = new Set(prev)
        leftIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  // Move all checked records to right
  const moveCheckedToRight = () => {
    const toMove = leftRecords.filter((r) => checkedIds.has(r.id))
    if (toMove.length === 0) return
    setSelected((prev) => [...prev, ...toMove])
    setCheckedIds((prev) => {
      const next = new Set(prev)
      toMove.forEach((r) => next.delete(r.id))
      return next
    })
  }

  // ---- Drag handlers ----
  const handleDragStart = (e: React.DragEvent, id: string, from: 'left' | 'right') => {
    dragPayload.current = { id, from }
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDropOnRight = (e: React.DragEvent) => {
    e.preventDefault()
    setRightDragOver(false)
    const payload = dragPayload.current
    if (!payload || payload.from !== 'left') return
    const record = allRecords.find((r) => r.id === payload.id)
    if (record && !selectedIds.has(record.id)) {
      setSelected((prev) => [...prev, record])
      setCheckedIds((prev) => { const next = new Set(prev); next.delete(record.id); return next })
    }
    dragPayload.current = null
  }

  const handleDropOnLeft = (e: React.DragEvent) => {
    e.preventDefault()
    setLeftDragOver(false)
    const payload = dragPayload.current
    if (!payload || payload.from !== 'right') return
    setSelected((prev) => prev.filter((r) => r.id !== payload.id))
    dragPayload.current = null
  }

  const removeFromRight = (id: string) => {
    setSelected((prev) => prev.filter((r) => r.id !== id))
  }

  // ---- Derived state ----
  const hasMissingFiles = selected.some((r) => !r.raw_file_id)

  const handleContinue = () => {
    navigate('/measurement/create/details', { state: { selectedRecords: selected } })
  }

  return (
    <WidePageLayout>
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Page header */}
        <div style={{
          padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.lg,
        }}>
          <h2 style={{ margin: 0, fontSize: theme.typography.fontSize.xl, color: theme.colors.textDark }}>
            Create Measurement — Select Records
          </h2>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <button
              onClick={() => navigate('/measurements')}
              style={{ ...buttonBase, backgroundColor: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSecondary }}
            >
              Cancel
            </button>

            {/* Upload Files with tooltip */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowUploadTooltip(true)}
              onMouseLeave={() => setShowUploadTooltip(false)}
            >
              <button
                onClick={() => navigate('/logs/upload')}
                style={{ ...buttonBase, backgroundColor: theme.colors.bg, border: `1px solid ${theme.colors.primary}`, color: theme.colors.primary }}
              >
                Upload Files
              </button>
              {showUploadTooltip && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(-100% + 8px)',
                  right: 0,
                  backgroundColor: theme.colors.infoBorder,
                  color: theme.colors.textDark,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: theme.borders.radius.sm,
                  fontSize: theme.typography.fontSize.xs,
                  whiteSpace: 'nowrap',
                  zIndex: 100,
                  pointerEvents: 'none',
                  boxShadow: theme.shadows.sm,
                }}>
                  If your files are not uploaded yet, upload them first.
                </div>
              )}
            </div>

            <button
              disabled={selected.length === 0}
              onClick={handleContinue}
              style={{
                ...buttonBase,
                backgroundColor: selected.length === 0 ? theme.colors.mutedLighter : theme.colors.primary,
                color: selected.length === 0 ? theme.colors.muted : '#fff',
                cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Continue →
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: theme.colors.danger, padding: theme.spacing.lg, fontSize: theme.typography.fontSize.sm }}>
            Failed to load records: {error}
          </div>
        )}

        {/* Transfer bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.sm} ${theme.spacing['2xl']}`,
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: '#fafafa',
        }}>
          <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.muted }}>
            {checkedIds.size > 0 ? `${checkedIds.size} record(s) selected` : 'Check rows or drag them to the right panel'}
          </span>
          <button
            disabled={checkedIds.size === 0}
            onClick={moveCheckedToRight}
            style={{
              ...buttonBase,
              padding: `${theme.spacing.xs} ${theme.spacing.lg}`,
              backgroundColor: checkedIds.size > 0 ? theme.colors.primary : theme.colors.mutedLighter,
              color: checkedIds.size > 0 ? 'white' : theme.colors.muted,
              cursor: checkedIds.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: theme.typography.fontSize.xs,
            }}
          >
            Add selected →
          </button>
          {selected.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: theme.typography.fontSize.sm, color: theme.colors.success, fontWeight: theme.typography.fontWeight.medium }}>
              {selected.length} records selected for measurement
              {hasMissingFiles && (
                <span style={{ color: theme.colors.warning, marginLeft: theme.spacing.sm }}>
                  ⚠ Some records have no uploaded file.
                </span>
              )}
            </span>
          )}
        </div>

        {/* Two-panel area */}
        <div style={{
          display: 'flex',
          gap: 0,
          height: '60vh',
          minHeight: 360,
        }}>
          {/* LEFT PANEL */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRight: `1px solid ${theme.colors.border}`,
              backgroundColor: leftDragOver ? theme.colors.infoBg : theme.colors.bg,
              transition: `background ${theme.transitions.fast}`,
            }}
            onDragOver={(e) => { e.preventDefault(); setLeftDragOver(true) }}
            onDrop={handleDropOnLeft}
            onDragLeave={() => setLeftDragOver(false)}
          >
            <div style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderBottom: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.infoBg,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textDark,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}>
              <span>Available Records</span>
              <span style={{ color: theme.colors.muted, fontWeight: 400 }}>({leftRecords.length})</span>
              {leftDragOver && (
                <span style={{ marginLeft: 'auto', color: '#b45309', fontSize: theme.typography.fontSize.xs }}>
                  Drop to section
                </span>
              )}
            </div>
            <ColHeaders
              sortField={leftSortField}
              sortDir={leftSortDir}
              onSort={handleLeftSort}
              showCheckbox
              allChecked={allChecked}
              someChecked={someChecked}
              onToggleAll={toggleAllCheck}
            />
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
                  Loading records…
                </div>
              ) : leftRecords.length === 0 ? (
                <EmptyState message={allRecords.length === 0 ? 'No completed records available.' : 'All records have been added to selection.'} />
              ) : (
                leftRecords.map((record) => (
                  <RecordRow
                    key={record.id}
                    record={record}
                    side="left"
                    checked={checkedIds.has(record.id)}
                    onCheck={toggleCheck}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: rightDragOver ? theme.colors.infoBgGreen : theme.colors.bg,
              transition: `background ${theme.transitions.fast}`,
            }}
            onDragOver={(e) => { e.preventDefault(); setRightDragOver(true) }}
            onDrop={handleDropOnRight}
            onDragLeave={() => setRightDragOver(false)}
          >
            <div style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderBottom: `1px solid ${theme.colors.border}`,
              backgroundColor: selected.length > 0 ? theme.colors.infoBgGreen : theme.colors.infoBg,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: selected.length > 0 ? theme.colors.success : theme.colors.textDark,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              transition: `background ${theme.transitions.fast}`,
            }}>
              <span>Selected for Measurement</span>
              <span style={{ fontWeight: 400, color: theme.colors.muted }}>({selected.length})</span>
              {rightDragOver && (
                <span style={{ marginLeft: 'auto', color: theme.colors.successLight, fontSize: theme.typography.fontSize.xs }}>
                  Drop here to add to selection
                </span>
              )}
            </div>
            {selected.length > 0 && (
              <ColHeaders
                sortField={rightSortField}
                sortDir={rightSortDir}
                onSort={handleRightSort}
              />
            )}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {selected.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: theme.colors.mutedLight,
                  gap: theme.spacing.md,
                  userSelect: 'none',
                }}>
                  <span style={{ fontSize: '2rem' }}>⟶</span>
                  <span style={{ fontSize: theme.typography.fontSize.sm }}>
                    Drag records here or use checkboxes + "Add selected"
                  </span>
                </div>
              ) : (
                rightRecords.map((record) => (
                  <RecordRow
                    key={record.id}
                    record={record}
                    side="right"
                    onDragStart={handleDragStart}
                    onRemove={removeFromRight}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </WidePageLayout>
  )
}
