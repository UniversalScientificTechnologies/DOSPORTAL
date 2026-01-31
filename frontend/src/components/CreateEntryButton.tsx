import React from 'react'
import { Link } from 'react-router-dom'
import { theme } from '../theme'

interface CreateEntryButtonProps {
  onClick?: () => void
  to?: string // optional: for react-router link
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export const CreateEntryButton: React.FC<CreateEntryButtonProps> = ({
  onClick,
  to,
  children = '+ Create Entry',
  style = {},
  className = '',
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    background: theme.colors.success,
    color: 'white',
    border: 'none',
    borderRadius: theme.borders.radius.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.base,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: theme.transitions.fast,
    textAlign: 'center',
    ...style,
  }
  if (to) {
    return (
      <Link
        to={to}
        className={`create-entry-btn ${className}`}
        style={baseStyle}
      >
        {children}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`create-entry-btn ${className}`}
      style={baseStyle}
    >
      {children}
    </button>
  )
}
