import React from 'react'
import { Link } from 'react-router-dom'
import { theme } from '@/theme'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  onClick?: () => void
  to?: string
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  title?: string
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: theme.colors.primary,
    color: theme.colors.bg,
    border: 'none',
  },
  success: {
    background: theme.colors.success,
    color: 'white',
    border: 'none',
  },
  secondary: {
    background: theme.colors.bg,
    color: theme.colors.textSecondary,
    border: `${theme.borders.width} solid ${theme.colors.border}`,
  },
  danger: {
    background: theme.colors.danger,
    color: theme.colors.bg,
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: theme.colors.textDark,
    border: 'none',
  },
  outline: {
    background: 'transparent',
    color: theme.colors.textSecondary,
    border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
  },
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    fontSize: theme.typography.fontSize.sm,
  },
  md: {
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    fontSize: theme.typography.fontSize.base,
  },
  lg: {
    padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
    fontSize: theme.typography.fontSize.lg,
  },
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  to,
  children,
  style = {},
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  type = 'button',
  title,
  ...rest
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    borderRadius: theme.borders.radius.sm,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: 'inherit',
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: theme.transitions.fast,
    textAlign: 'center',
    textDecoration: 'none',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  }
  const content = (
    <>
      {icon && <span style={{ marginRight: 8, display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </>
  )
  if (to) {
    return (
      <Link
        to={to}
        className={`button ${variant} ${size} ${className}`}
        style={baseStyle}
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        title={title}
        {...rest}
      >
        {content}
      </Link>
    )
  }
  return (
    <button
      type={type}
      onClick={onClick}
      className={`button ${variant} ${size} ${className}`}
      style={baseStyle}
      disabled={disabled}
      title={title}
      {...rest}
    >
      {content}
    </button>
  )
}
