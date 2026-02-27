import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { theme } from '@/theme'

interface SectionProps {
  title?: string
  subtitle?: string
  error?: string | null
  actions?: ReactNode
  backLink?: { to: string; label: string }
  children?: ReactNode
  style?: React.CSSProperties
  maxWidth?: number | string
  isLoading?: boolean
  loadingText?: string
}

export const Section = ({ title, subtitle, actions, error, backLink, children, style, maxWidth, isLoading, loadingText = 'Loading...' }: SectionProps) => {
  const hasHeader = title || actions
  const sectionStyle: React.CSSProperties = maxWidth
    ? { maxWidth, margin: '0 auto', ...style }
    : style ?? {}
  return (
    <section className="panel" style={sectionStyle}>
      {hasHeader && (
        <header className="panel-header">
          <div>
            {backLink && (
              <Link
                to={backLink.to}
                style={{
                  color: theme.colors.muted,
                  textDecoration: 'none',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: theme.transitions.fast,
                  display: 'inline-block',
                  marginBottom: theme.spacing.md,
                }}
              >
                ← {backLink.label}
              </Link>
            )}
            {title && <h2 style={{ marginTop: 0, marginBottom: subtitle ? theme.spacing.xs : 0 }}>{title}</h2>}
            {subtitle && (
              <p style={{ margin: 0, fontSize: theme.typography.fontSize.sm, color: theme.colors.muted }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className="panel-body">
        {error && (
          <div style={{ color: theme.colors.danger, marginBottom: theme.spacing.md }}>{error}</div>
        )}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing['3xl'], color: theme.colors.muted }}>
            <div className="section-spinner" />
            <span style={{ fontSize: theme.typography.fontSize.sm }}>{loadingText}</span>
          </div>
        ) : children}
      </div>
    </section>
  )
}
