import { useParams } from 'react-router-dom'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { FormField } from '@/shared/components/common/FormField'
import { JsonEditor } from '@/shared/components/common/JsonEditor'
import { SpectralCharts } from '@/features/logs/components/SpectralCharts'
import { theme } from '@/theme'
import ReactMarkdown from 'react-markdown'
import {
  useSpectralRecordsRetrieve,
  useSpectralRecordArtifactsList,
} from '@/api/spectral-records/spectral-records'
import type { SpectralRecordArtifact } from '@/api/model'
import { formatDate } from '@/shared/utils/formatDate'

const PROCESSING_STATUS_LABELS: Record<string, string> = {
  'pending': 'Pending',
  'processing': 'Processing',
  'completed': 'Completed',
  'failed': 'Failed',
}

const ARTIFACT_TYPE_LABELS: Record<string, string> = {
  'spectral': 'Spectral Files (Parquet)',
}

export const SpectralRecordDetailPage = () => {
  const { id } = useParams<{ id: string }>()

  const recordQuery = useSpectralRecordsRetrieve(id ?? '', { query: { enabled: !!id } })
  const record = recordQuery.data?.data
  const artifactsCount = record ? parseInt(String(record.artifacts_count)) : 0
  const artifactsQuery = useSpectralRecordArtifactsList(
    { spectral_record: id },
    { query: { enabled: !!id && !!record && artifactsCount > 0 } },
  )
  const artifacts: SpectralRecordArtifact[] = artifactsQuery.data?.data?.results ?? []
  const loading = recordQuery.isLoading
  const artifactsLoading = artifactsQuery.isLoading
  const error = recordQuery.isError
    ? `Failed to load spectral record: ${(recordQuery.error as Error).message}`
    : null

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
        <Section
        title="Spectral Record Detail"
        error={error}
        backLink={{to: '/logs', label: 'Back to Logs' }}>
          {null}
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

  const statusLabel = PROCESSING_STATUS_LABELS[record.processing_status ?? ''] || record.processing_status

  return (
    <PageLayout>
      <Section title={record.name ?? 'Spectral Record'} backLink={{ to: '/logs', label: 'Back to Logs' }}>
          {/* Basic Information */}
          <Section title='Basic Information'>
            <FormField
              label='Processing Status'
              isReadOnly={true}
              value={statusLabel ?? 'unknown'}/>

            <FormField
              label="Created"
              value={formatDate(record.created)}
              isReadOnly={true}
            />
            
            {record.author && (
              <FormField
                label="Author"
                value={`@${record.author.username}`}
                linkTo={`/user/${record.author.id}`}
                isReadOnly={true}
              />
            )}
            
            <FormField
              label="Owner"
              value={record.owner?.name ?? '—'}
              isReadOnly={true}
            />
            
            <FormField
              label="Detector"
              value={record.detector ?? '—'}
              linkTo={record.detector ? `/device/${record.detector}` : undefined}
              isReadOnly={true}
            />
            
            <FormField
              label="Artifacts"
              value={String(artifactsCount)}
              isReadOnly={true}
            />
          </Section>

          {/* Description */}
          {record.description && (
            <div style={{
              gridColumn: '1 / -1',
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.bg,
              border: `${theme.borders.width} solid ${theme.colors.border}`,
              borderRadius: theme.borders.radius.sm,
              marginTop: theme.spacing.sm
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

          {/* Metadata */}
          {record.metadata != null && typeof record.metadata === 'object' && Object.keys(record.metadata as object).length > 0 && (
            <div style={{
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.bg,
              border: `${theme.borders.width} solid ${theme.colors.border}`,
              borderRadius: theme.borders.radius.sm,
              marginTop: theme.spacing.sm,
            }}>
              <JsonEditor
                label="Metadata"
                value={record.metadata as object}
                readOnly
                height="220px"
              />
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
            const artifactsByType: Record<string, SpectralRecordArtifact[]> = {}
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
                      marginTop: theme.spacing.sm
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
                        {artifact.artifact && (
                          <>
                            <FormField
                              label="Filename"
                              value={artifact.artifact.filename}
                              isReadOnly={true}
                            />
                            
                            <FormField
                              label="File Type"
                              value={String(artifact.artifact.file_type ?? '').toUpperCase()}
                              isReadOnly={true}
                            />
                            
                            <FormField
                              label="Size"
                              value={formatFileSize(artifact.artifact.size)}
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

          {/* Charts - only show when processing is completed */}
          {record.processing_status === 'completed' && (
            <div style={{ gridColumn: '1 / -1', marginTop: theme.spacing.sm }}>
              <SpectralCharts recordId={id!}/>
            </div>
          )}
      </Section>
    </PageLayout>
  )
}
