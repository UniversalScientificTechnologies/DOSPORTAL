interface EmptyStateProps {
  message: string
  style?: React.CSSProperties
}

export const EmptyState = ({ message, style = {} }: EmptyStateProps) => {
  return <p className="muted" style={style}>{message}</p>
}
