interface EmptyStateProps {
  message: string
}

export const EmptyState = ({ message }: EmptyStateProps) => {
  return <p className="muted">{message}</p>
}
