import { useNavigate } from 'react-router-dom'

interface DetectorCardProps {
  detector: {
    id: string
    name: string
    sn: string
    type: {
      name: string
      manufacturer: {
        name: string
      }
    }
  }
}

export const DetectorCard = ({ detector }: DetectorCardProps) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/logbook/${detector.id}`)}
      style={{
        padding: '1.5rem',
        background: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#0d6efd'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,110,253,0.15)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e7eb'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', color: '#111827' }}>
        {detector.name}
      </h3>
      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
        <div style={{ marginBottom: '0.25rem' }}>
          <strong>Type:</strong> {detector.type?.name || 'N/A'}
        </div>
        <div>
          <strong>Serial:</strong> {detector.sn}
        </div>
      </div>
      <div
        style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #e5e7eb',
          fontSize: '0.875rem',
          color: '#0d6efd',
          fontWeight: '500',
        }}
      >
        View Logbook →
      </div>
    </div>
  )
}
