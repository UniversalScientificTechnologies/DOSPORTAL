import type { ReactNode } from 'react'

interface SectionProps {
  title?: string | ReactNode
  children: ReactNode
  style?: React.CSSProperties
}

export const Section = ({ title, children, style }: SectionProps) => {
  return (
    <section className="panel" style={style}>
      {title && (
        <header className="panel-header">
          {typeof title === 'string' ? <h2>{title}</h2> : title}
        </header>
      )}
      <div className="panel-body">
        {children}
      </div>
    </section>
  )
}
