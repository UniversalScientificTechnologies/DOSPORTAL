import { theme } from '@/theme'

export type ToastVariant = 'success' | 'error' | 'info'

export type ToastState = { message: string; variant: ToastVariant } | null

interface AppToastProps {
  toast: ToastState
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; text: string; border: string; prefix: string }> = {
  success: {
    bg: theme.colors.successBg,
    text: theme.colors.successText,
    border: theme.colors.successBorder,
    prefix: '✓',
  },
  error: {
    bg: '#fef2f2',
    text: theme.colors.danger,
    border: '#fecaca',
    prefix: '✕',
  },
  info: {
    bg: theme.colors.infoBg,
    text: theme.colors.primary,
    border: theme.colors.infoBorder,
    prefix: 'ℹ',
  },
}

export const AppToast = ({ toast }: AppToastProps) => {
  if (!toast) return null

  const s = VARIANT_STYLES[toast.variant]

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        backgroundColor: s.bg,
        color: s.text,
        padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
        borderRadius: theme.borders.radius.sm,
        border: `${theme.borders.width} solid ${s.border}`,
        boxShadow: theme.shadows.sm,
        zIndex: 1000,
        animation: 'slideIn 0.3s ease-out',
        maxWidth: '360px',
        fontSize: theme.typography.fontSize.sm,
      }}
    >
      {s.prefix} {toast.message}
    </div>
  )
}
