import { theme } from '@/theme'

interface SuccessToastProps {
  message: string | null
}

export const SuccessToast = ({ message }: SuccessToastProps) => {
  if (!message) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        backgroundColor: theme.colors.successBg,
        color: theme.colors.successText,
        padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
        borderRadius: theme.borders.radius.sm,
        border: `${theme.borders.width} solid ${theme.colors.successBorder}`,
        boxShadow: theme.shadows.sm,
        zIndex: 1000,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      ✓ {message}
    </div>
  )
}
