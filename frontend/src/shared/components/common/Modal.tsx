import type { ReactNode } from 'react'
import { theme } from '@/theme'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  minWidth?: number | string
}

export const Modal = ({ title, onClose, children, minWidth = 350 }: ModalProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.colors.bg,
          borderRadius: theme.borders.radius.md,
          boxShadow: theme.shadows.lg,
          padding: theme.spacing['2xl'],
          minWidth,
          maxWidth: '90vw',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 style={{ marginTop: 0, marginBottom: theme.spacing.xl }}>{title}</h4>
        {children}
      </div>
    </div>
  )
}
