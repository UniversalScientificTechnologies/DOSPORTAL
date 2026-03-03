import type { ReactNode } from 'react'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { theme } from '@/theme'
import { EmptyState } from '../common/EmptyState'

export interface OrderableTableColumn<T> {
  id: string
  key: keyof T
  label: string
  render?: (value: unknown, row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
}

export interface OrderableItem {
  position: number
  [key: string]: unknown
}

interface OrderableTableProps<T extends OrderableItem> {
  columns: OrderableTableColumn<T>[]
  items: T[]
  onItemsChange: (items: T[]) => void
  selectedKey?: string | number
  onSelectRow?: (row: T) => void
  onDeleteRow?: (row: T) => void
  getRowKey: (row: T) => string | number
  emptyMessage?: string
}

function reindex<T extends OrderableItem>(items: T[]): T[] {
  return items.map((item, i) => ({ ...item, position: i + 1 }))
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// ── inner row component (hooks must not be called in a loop) ──────────────────

interface SortableRowProps<T extends OrderableItem> {
  row: T
  index: number
  rowKey: string | number
  totalItems: number
  columns: OrderableTableColumn<T>[]
  isSelected: boolean
  onSelectRow?: (row: T) => void
  onDeleteRow?: (row: T) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

function SortableRow<T extends OrderableItem>({
  row,
  index,
  rowKey,
  totalItems,
  columns,
  isSelected,
  onSelectRow,
  onDeleteRow,
  onMoveUp,
  onMoveDown,
}: SortableRowProps<T>) {
  const { ref, handleRef } = useSortable({ id: rowKey, index })

  return (
    <tr
      ref={ref}
      onClick={() => onSelectRow?.(row)}
      style={{
        borderBottom: `${theme.borders.width} solid ${theme.colors.border}`,
        cursor: onSelectRow ? 'pointer' : 'default',
        transition: theme.transitions.fast,
        backgroundColor: isSelected ? theme.colors.infoBg : theme.colors.bg,
        outline: isSelected ? `2px solid ${theme.colors.primary}` : 'none',
        outlineOffset: '-2px',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = theme.colors.infoBg
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = theme.colors.bg
      }}
    >
      {/* drag handle */}
      <td
        ref={handleRef}
        style={{
          padding: theme.spacing.lg,
          color: theme.colors.textSecondary,
          cursor: 'grab',
          textAlign: 'center',
          userSelect: 'none',
        }}
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </td>

      {columns.map((column) => {
        const value = row[column.key as string] as unknown
        const content = column.render ? column.render(value, row) : String(value ?? '')
        return (
          <td
            key={column.id}
            style={{
              padding: theme.spacing.lg,
              textAlign: column.align || 'left',
              color: theme.colors.textSecondary,
            }}
          >
            {content}
          </td>
        )
      })}

      {/* move arrows */}
      <td
        style={{ padding: theme.spacing.lg, textAlign: 'center', whiteSpace: 'nowrap' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          title="Move up"
          disabled={index === 0}
          onClick={(e) => { e.stopPropagation(); onMoveUp(index) }}
          style={arrowButtonStyle(index === 0)}
        >
          ↑
        </button>
        <button
          title="Move down"
          disabled={index === totalItems - 1}
          onClick={(e) => { e.stopPropagation(); onMoveDown(index) }}
          style={arrowButtonStyle(index === totalItems - 1)}
        >
          ↓
        </button>
      </td>

      {/* delete */}
      {onDeleteRow && (
        <td
          style={{ padding: theme.spacing.lg, textAlign: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            title="Remove"
            onClick={(e) => { e.stopPropagation(); onDeleteRow(row) }}
            style={deleteButtonStyle}
          >
            ✕
          </button>
        </td>
      )}
    </tr>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export function OrderableTable<T extends OrderableItem>({
  columns,
  items,
  onItemsChange,
  selectedKey,
  onSelectRow,
  onDeleteRow,
  getRowKey,
  emptyMessage = 'Empty',
}: OrderableTableProps<T>) {
  const totalColumns = columns.length + 2 + (onDeleteRow ? 1 : 0)

  const moveUp = (index: number) => {
    if (index === 0) return
    onItemsChange(reindex(arrayMove(items, index, index - 1)))
  }

  const moveDown = (index: number) => {
    if (index === items.length - 1) return
    onItemsChange(reindex(arrayMove(items, index, index + 1)))
  }

  const handleDragEnd = (event: { canceled: boolean; operation: { source: { id: string | number } | null; target: { id: string | number } | null } }) => {
    if (event.canceled) return
    const sourceId = event.operation.source?.id
    const targetId = event.operation.target?.id
    if (sourceId === undefined || targetId === undefined || sourceId === targetId) return

    const fromIndex = items.findIndex((item) => getRowKey(item) === sourceId)
    const toIndex = items.findIndex((item) => getRowKey(item) === targetId)
    if (fromIndex === -1 || toIndex === -1) return

    onItemsChange(reindex(arrayMove(items, fromIndex, toIndex)))
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div
        style={{
          overflowX: 'auto',
          backgroundColor: theme.colors.bg,
          borderRadius: theme.borders.radius.sm,
          border: `${theme.borders.width} solid ${theme.colors.border}`,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: theme.colors.infoBg,
                borderBottom: `${theme.borders.width} solid ${theme.colors.border}`,
              }}
            >
              {/* drag handle col */}
              <th style={{ width: '2rem', padding: theme.spacing.lg }} />

              {columns.map((column) => (
                <th
                  key={column.id}
                  style={{
                    padding: theme.spacing.lg,
                    textAlign: column.align || 'left',
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.textDark,
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {column.label}
                </th>
              ))}

              {/* arrows col */}
              <th style={{ width: '4.5rem', padding: theme.spacing.lg }} />

              {/* delete col */}
              {onDeleteRow && <th style={{ width: '2rem', padding: theme.spacing.lg }} />}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={totalColumns}
                  style={{ padding: theme.spacing['2xl'], textAlign: 'center' }}
                >
                  <EmptyState message={emptyMessage} />
                </td>
              </tr>
            )}
            {items.map((row, index) => {
              const key = getRowKey(row)
              return (
                <SortableRow
                  key={key}
                  row={row}
                  index={index}
                  rowKey={key}
                  totalItems={items.length}
                  columns={columns}
                  isSelected={selectedKey !== undefined && key === selectedKey}
                  onSelectRow={onSelectRow}
                  onDeleteRow={onDeleteRow}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </DragDropProvider>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const arrowButtonStyle = (disabled: boolean): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  cursor: disabled ? 'default' : 'pointer',
  padding: '0 0.2rem',
  fontSize: theme.typography.fontSize.sm,
  color: disabled ? theme.colors.border : theme.colors.textSecondary,
  lineHeight: 1,
})

const deleteButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0 0.2rem',
  fontSize: theme.typography.fontSize.sm,
  color: theme.colors.textSecondary,
  lineHeight: 1,
}
