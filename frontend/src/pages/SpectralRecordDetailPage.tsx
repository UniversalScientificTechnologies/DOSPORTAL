import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { Section } from '../components/Section'
import { EmptyState } from '../components/EmptyState'
import { FormField } from '../components/FormField'
import { theme } from '../theme'
import ReactMarkdown from 'react-markdown'

type FileData = {
  id: string
  filename: string
  file: string
  file_type: string
  source_type: string
  metadata: Record<string, unknown>
  size: number | null
  created_at: string
  author: number | null
  owner: string | null
}

type Artifact = {
  id: string
  artifact_type: string
  created_at: string
  file: FileData | null
}

type SpectralRecord = {
  id: string
  name: string
  processing_status: string
  created: string
  author: {
    id: number
    username: string
    first_name?: string
    last_name?: string
  } | null
  owner: string | null
  raw_file_id: string | null
  artifacts_count: number
  description?: string
}

const PROCESSING_STATUS_LABELS: Record<string, string> = {
  'pending': 'Pending',
  'processing': 'Processing',
  'completed': 'Completed',
  'failed': 'Failed',
}

const PROCESSING_STATUS_COLORS: Record<string, string> = {
  'pending': theme.colors.muted,
  'processing': theme.colors.primary,
  'completed': theme.colors.success,
  'failed': theme.colors.danger,
}

const ARTIFACT_TYPE_LABELS: Record<string, string> = {
  'spectral': 'Spectral Files (Parquet)',
}

export const SpectralRecordDetailPage = ({
  apiBase,
  isAuthed,
  getAuthHeader,
}: {
  apiBase: string
  isAuthed: boolean
  getAuthHeader: () => { Authorization?: string }
}) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<SpectralRecord | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [artifactsLoading, setArtifactsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthed || !id) {
      setLoading(false)
      return
    }

    const fetchRecord = async () => {
      try {
        const res = await fetch(`${apiBase}/spectral-record/${id}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        })
        
        if (res.status === 404) {
          setError('Spectral record not found')
          setLoading(false)
          return
        }
        
        if (res.status === 403) {
          setError('You do not have permission to view this record')
          setLoading(false)
          return
        }
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data = await res.json()
        setRecord(data)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        setError(`Failed to load spectral record: ${message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [apiBase, isAuthed, getAuthHeader, id])

  // Fetch artifacts separately when record is loaded
  useEffect(() => {
    if (!isAuthed || !id || !record || record.artifacts_count === 0) {
      return
    }

    const fetchArtifacts = async () => {
      setArtifactsLoading(true)
      try {
        const res = await fetch(`${apiBase}/spectral-record-artifact/?record_id=${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        })
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data = await res.json()
        setArtifacts(data)
      } catch (e: unknown) {
        console.error('Failed to load artifacts:', e)
        // Don't set error state, just log - artifacts are not critical
      } finally {
        setArtifactsLoading(false)
      }
    }

    fetchArtifacts()
  }, [apiBase, isAuthed, getAuthHeader, id, record])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'N/A'
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  if (!isAuthed) {
    return (
      <PageLayout>
        <div className="panel">
          <div style={{ color: theme.colors.danger, padding: theme.spacing['3xl'] }}>
            Login required to view spectral record details.
          </div>
        </div>
      </PageLayout>
    )
  }

  if (loading) {
    return (
      <PageLayout>
        <Section title="Spectral Record Detail">
          <div style={{ padding: theme.spacing['3xl'], textAlign: 'center', color: theme.colors.muted }}>
            Loading record...
          </div>
        </Section>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <Section title="Spectral Record Detail">
          <div style={{
            padding: theme.spacing['2xl'],
            color: theme.colors.danger,
            backgroundColor: theme.colors.successBg,
            borderRadius: theme.borders.radius.sm,
            marginBottom: theme.spacing.xl,
          }}>
            {error}
          </div>
          <button
            onClick={() => navigate('/logs')}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              backgroundColor: theme.colors.primary,
              color: theme.colors.bg,
              border: 'none',
              borderRadius: theme.borders.radius.sm,
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            ← Back to Logs
          </button>
        </Section>
      </PageLayout>
    )
  }

  if (!record) {
    return (
      <PageLayout>
        <Section title="Spectral Record Detail">
          <EmptyState message="Spectral record not found" />
        </Section>
      </PageLayout>
    )
  }

  const statusLabel = PROCESSING_STATUS_LABELS[record.processing_status] || record.processing_status
  const statusColor = PROCESSING_STATUS_COLORS[record.processing_status] || theme.colors.textSecondary

  return (
    <PageLayout>
      <Section title={record.name}>
        <div style={{ marginBottom: theme.spacing.xl }}>
          <Link
            to="/logs"
            style={{
              color: theme.colors.muted,
              textDecoration: 'none',
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            ← Back to Logs
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gap: theme.spacing.xl,
          gridTemplateColumns: '1fr 1fr',
        }}>
          {/* Basic Information */}
          <div style={{
            gridColumn: '1 / -1',
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.bg,
            border: `${theme.borders.width} solid ${theme.colors.border}`,
            borderRadius: theme.borders.radius.sm,
          }}>
            <h3 style={{
              marginTop: 0,
              marginBottom: theme.spacing.lg,
              color: theme.colors.textDark,
              fontSize: theme.typography.fontSize.lg,
            }}>
              Basic Information
            </h3>
            
            <div style={{ marginBottom: theme.spacing['2xl'], paddingBottom: theme.spacing.lg, borderBottom: `${theme.borders.width} solid ${theme.colors.border}` }}>
              <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textSecondary }}>
                Processing Status
              </label>
              <span style={{
                color: statusColor,
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.lg,
              }}>
                {statusLabel}
              </span>
            </div>
            
            <FormField
              label="Created"
              value={formatDate(record.created)}
              isReadOnly={true}
            />
            
            {record.author && (
              <div style={{ marginBottom: theme.spacing['2xl'], paddingBottom: theme.spacing.lg, borderBottom: `${theme.borders.width} solid ${theme.colors.border}` }}>
                <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.textSecondary }}>
                  Author
                </label>
                <Link
                  to={`/user/${record.author.id}`}
                  style={{
                    color: theme.colors.primary,
                    textDecoration: 'none',
                  }}
                >
                  @{record.author.username}
                </Link>
              </div>
            )}
            
            <FormField
              label="Owner"
              value={record.owner || '—'}
              isReadOnly={true}
            />
            
            <FormField
              label="Artifacts"
              value={String(record.artifacts_count)}
              isReadOnly={true}
            />
          </div>

          {/* Description */}
          {record.description && (
            <div style={{
              gridColumn: '1 / -1',
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.bg,
              border: `${theme.borders.width} solid ${theme.colors.border}`,
              borderRadius: theme.borders.radius.sm,
            }}>
              <h3 style={{
                marginTop: 0,
                marginBottom: theme.spacing.lg,
                color: theme.colors.textDark,
                fontSize: theme.typography.fontSize.lg,
              }}>
                Description
              </h3>
              <div className="text" style={{ marginTop: theme.spacing.md }}>
                <ReactMarkdown>{record.description}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Artifacts by Type */}
          {artifactsLoading && (
            <div style={{
              gridColumn: '1 / -1',
              padding: theme.spacing.xl,
              textAlign: 'center',
              color: theme.colors.muted,
            }}>
              Loading artifacts...
            </div>
          )}
          
          {!artifactsLoading && artifacts.length > 0 && (() => {
            // Group artifacts by type
            const artifactsByType: Record<string, Artifact[]> = {}
            artifacts.forEach(artifact => {
              if (!artifactsByType[artifact.artifact_type]) {
                artifactsByType[artifact.artifact_type] = []
              }
              artifactsByType[artifact.artifact_type].push(artifact)
            })
            
            return (
              <>
                {Object.entries(artifactsByType).map(([artifactType, typeArtifacts]) => (
                  <div
                    key={artifactType}
                    style={{
                      gridColumn: '1 / -1',
                      padding: theme.spacing.xl,
                      backgroundColor: theme.colors.bg,
                      border: `${theme.borders.width} solid ${theme.colors.border}`,
                      borderRadius: theme.borders.radius.sm,
                    }}
                  >
                    <h3 style={{
                      marginTop: 0,
                      marginBottom: theme.spacing.lg,
                      color: theme.colors.textDark,
                      fontSize: theme.typography.fontSize.lg,
                    }}>
                      {ARTIFACT_TYPE_LABELS[artifactType] || artifactType}
                    </h3>
                    
                    {typeArtifacts.map((artifact, index) => (
                      <div
                        key={artifact.id}
                        style={{
                          marginBottom: index < typeArtifacts.length - 1 ? theme.spacing.xl : 0,
                          paddingBottom: index < typeArtifacts.length - 1 ? theme.spacing.xl : 0,
                          borderBottom: index < typeArtifacts.length - 1 ? `${theme.borders.width} solid ${theme.colors.border}` : 'none',
                        }}
                      >
                        {artifact.file && (
                          <>
                            <FormField
                              label="Filename"
                              value={artifact.file.filename}
                              isReadOnly={true}
                            />
                            
                            <FormField
                              label="File Type"
                              value={artifact.file.file_type.toUpperCase()}
                              isReadOnly={true}
                            />
                            
                            <FormField
                              label="Size"
                              value={formatFileSize(artifact.file.size)}
                              isReadOnly={true}
                            />
                            
                            <FormField
                              label="Created"
                              value={formatDate(artifact.created_at)}
                              isReadOnly={true}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )
          })()}
        </div>
      </Section>
    </PageLayout>
  )
}
