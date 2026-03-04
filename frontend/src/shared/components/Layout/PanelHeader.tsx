import type { ReactNode } from 'react'
import { theme } from '@/theme'

interface PanelHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export const PanelHeader = ({ title, subtitle, actions }: PanelHeaderProps) => (
  <header className="panel-header">
    <div>
      <h2 style={{ marginTop: 0, marginBottom: subtitle ? theme.spacing.xs : 0 }}>{title}</h2>
      {subtitle && (
        <p style={{ margin: 0, fontSize: theme.typography.fontSize.sm, color: theme.colors.muted }}>
          {subtitle}
        </p>
      )}
    </div>
    {actions}
  </header>
)
