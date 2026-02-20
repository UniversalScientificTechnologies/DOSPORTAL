import { useState } from 'react'
import type { ReactNode } from 'react'
import { theme } from '../theme'

export interface TableColumn<T> {
  id: string
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
}

interface SortableTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  defaultSortField?: keyof T
  defaultSortDirection?: 'asc' | 'desc'
  getRowKey: (row: T) => string | number
}

export function SortableTable<T>({
  columns,
  data,
  onRowClick,
  defaultSortField,
  defaultSortDirection = 'desc',
  getRowKey,
}: SortableTableProps<T>) {
  const [sortField, setSortField] = useState<keyof T | undefined>(defaultSortField)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection)

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedData = sortField
    ? [...data].sort((a, b) => {
        let aVal: unknown = a[sortField]
        let bVal: unknown = b[sortField]

        // Handle null/undefined values
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        // Handle nested objects (e.g., owner?.name)
        if (typeof aVal === 'object' && aVal !== null && 'name' in aVal) {
          aVal = (aVal as { name: string }).name
        }
        if (typeof bVal === 'object' && bVal !== null && 'name' in bVal) {
          bVal = (bVal as { name: string }).name
        }

        // String comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const aLower = aVal.toLowerCase()
          const bLower = bVal.toLowerCase()
          const comparison = aLower < bLower ? -1 : aLower > bLower ? 1 : 0
          return sortDirection === 'asc' ? comparison : -comparison
        }

        // Generic comparison for other types
        if (aVal != null && bVal != null) {
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          return sortDirection === 'asc' ? comparison : -comparison
        }
        return 0
      })
    : data

  const getSortIndicator = (field: keyof T) => {
    if (sortField !== field) return <span style={{ display: 'inline-block', width: '1em', marginLeft: '0.25em' }}></span>
    return (
      <span style={{ display: 'inline-block', width: '1em', marginLeft: '0.25em' }}>
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
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
            {columns.map((column) => (
              <th
                key={column.id}
                onClick={column.sortable !== false ? () => handleSort(column.key) : undefined}
                style={{
                  padding: theme.spacing.lg,
                  textAlign: column.align || 'left',
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textDark,
                  cursor: column.sortable !== false ? 'pointer' : 'default',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {column.label}
                {column.sortable !== false && getSortIndicator(column.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                borderBottom: `${theme.borders.width} solid ${theme.colors.border}`,
                cursor: onRowClick ? 'pointer' : 'default',
                transition: theme.transitions.fast,
                backgroundColor: theme.colors.bg,
              }}
              onMouseEnter={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.backgroundColor = theme.colors.infoBg
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bg
              }}
            >
              {columns.map((column) => {
                const value = row[column.key]
                const content = column.render ? column.render(value, row) : String(value || '')

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
