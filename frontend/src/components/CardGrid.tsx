import { ReactNode } from 'react'
import { theme } from '../theme'

interface CardGridProps {
  children: ReactNode
  minCardWidth?: string
  gap?: string
}

export const CardGrid = ({ children, minCardWidth = '280px', gap = theme.spacing.xl }: CardGridProps) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))`,
        gap: gap || theme.spacing.xl,
      }}
    >
      {children}
    </div>
  )
}
