import { theme } from '@/theme'
import type { ReactNode } from 'react'

export type ViewMode = 'cards' | 'table'

interface ViewToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

const CardsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-label="Cards view">
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
)

const TableIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-label="Table view">
    <rect x="1" y="1" width="14" height="3" rx="1" />
    <rect x="1" y="6" width="14" height="3" rx="1" />
    <rect x="1" y="11" width="14" height="3" rx="1" />
  </svg>
)

const options: { value: ViewMode; icon: ReactNode; label: string }[] = [
  { value: 'cards', icon: <CardsIcon />, label: 'Cards' },
  { value: 'table', icon: <TableIcon />, label: 'Table' },
]

const r = theme.borders.radius.sm

export const ViewToggle = ({ value, onChange }: ViewToggleProps) => {
  return (
    <div style={{
      display: 'flex',
      marginBottom: theme.spacing.xl,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.infoBg,
      borderRadius: r,
      width: 'fit-content',
    }}>
      {options.map((option, i) => {
        const isFirst = i === 0
        const isLast = i === options.length - 1
        const borderRadius = `${isFirst ? r : '0'} ${isLast ? r : '0'} ${isLast ? r : '0'} ${isFirst ? r : '0'}`
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            title={option.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: value === option.value ? theme.colors.primary : 'transparent',
              color: value === option.value ? theme.colors.bg : theme.colors.textSecondary,
              border: 'none',
              borderRadius,
              cursor: 'pointer',
              transition: theme.transitions.fast,
            }}
          >
            {option.icon}
          </button>
        )
      })}
    </div>
  )
}
