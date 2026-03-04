import type { ReactNode } from 'react'

interface InfoRowProps {
  label: string
  children: ReactNode
}

export const InfoRow = ({ label, children }: InfoRowProps) => (
  <div>
    <b>{label}:</b> {children}
  </div>
)
