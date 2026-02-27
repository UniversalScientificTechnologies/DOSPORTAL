import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/Button/Button'
import ReactMarkdown from 'react-markdown'
import { PageLayout } from '@/shared/components/Layout/PageLayout'
import { Section } from '@/shared/components/Layout/Section'
import { theme } from '@/theme'
import logbookBg from '@/assets/img/SPACEDOS01.jpg'
import {
  useDetectorsRetrieve,
  useLogbooksList,
  detectorsQrRetrieve,
} from '@/api/detectors/detectors'
import type { DetectorLogbook } from '@/api/model'
import axios from 'axios'

export const DevicePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [qrError, setQrError] = useState<string | null>(null)

  const detectorQuery = useDetectorsRetrieve(id ?? '', { query: { enabled: !!id } })
  const logbookQuery = useLogbooksList({ detector: id }, { query: { enabled: !!id } })

  const detector = detectorQuery.data?.data
  const logbook: DetectorLogbook[] = logbookQuery.data?.data?.results ?? []

  const loading = detectorQuery.isLoading || logbookQuery.isLoading

  const queryError = detectorQuery.error
    ? `Failed to load detector: ${(detectorQuery.error as Error).message}`
    : logbookQuery.error
    ? `Failed to load logbook: ${(logbookQuery.error as Error).message}`
    : null

  const error = queryError ?? qrError

  const handleQrDownload = async () => {
    if (!detector) return
    setQrError(null)
    try {
      const res = await detectorsQrRetrieve(
        detector.id,
        { label: 'true' },
        { responseType: 'blob' },
      )
      const blob = res.data as unknown as Blob
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `detector_${detector.sn}_qr.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      const msg = axios.isAxiosError(e)
        ? e.message
        : e instanceof Error
        ? e.message
        : 'Unknown error'
      setQrError(`Failed to download QR code: ${msg}`)
    }
  }

  return (
    <PageLayout
      backgroundImage={`linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${logbookBg})`}
    >
      <Section
        title={detector?.name ?? 'Detector Logbook'}
        backLink={{ to: '/logbooks', label: ' Back to Detectors' }}
        error={error}
        actions={
          detector ? (
            <button
              onClick={handleQrDownload}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                background: theme.colors.bg,
                color: theme.colors.primary,
                border: `${theme.borders.width} solid ${theme.colors.primary}`,
                borderRadius: theme.borders.radius.sm,
                fontSize: theme.typography.fontSize.sm,
                cursor: 'pointer',
                fontWeight: theme.typography.fontWeight.medium,
                transition: theme.transitions.fast,
              }}
            >
              QR
            </button>
          ) : undefined
        }
      >
        {loading && <p className="muted">Loading logbook...</p>}

        {detector && (
          <div
            style={{
              background: '#f9fafb',
              border: `${theme.borders.width} solid ${theme.colors.border}`,
              borderRadius: theme.borders.radius.sm,
              padding: theme.spacing['2xl'],
              marginBottom: theme.spacing.lg,
            }}
          >
            <h3
              style={{
                margin: `0 0 ${theme.spacing.lg} 0`,
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Detector Information
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
              }}
            >
              <div>
                <strong
                  style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}
                >
                  Serial Number:
                </strong>
                <div style={{ marginTop: theme.spacing.xs }}>{detector.sn}</div>
              </div>
              <div>
                <strong
                  style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}
                >
                  Type:
                </strong>
                <div style={{ marginTop: theme.spacing.xs }}>
                  {detector.type?.url ? (
                    <a
                      href={detector.type.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: theme.colors.primary, textDecoration: 'none' }}
                    >
                      {detector.type.name}
                    </a>
                  ) : (
                    detector.type?.name
                  )}
                </div>
              </div>
              {detector.owner && (
                <div>
                  <strong
                    style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}
                  >
                    Owner:
                  </strong>
                  <div style={{ marginTop: theme.spacing.xs }}>{detector.owner.name}</div>
                </div>
              )}
              {detector.manufactured_date && (
                <div>
                  <strong
                    style={{ color: theme.colors.muted, fontSize: theme.typography.fontSize.sm }}
                  >
                    Manufactured:
                  </strong>
                  <div style={{ marginTop: theme.spacing.xs }}>
                    {new Date(detector.manufactured_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="panel-body">
          <h3
            style={{
              marginTop: 0,
              marginBottom: theme.spacing.lg,
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.textSecondary,
            }}
          >
            Logbook Entries
          </h3>
          {logbook.length === 0 && !loading ? (
            <p className="muted">No logbook entries yet.</p>
          ) : (
            <ul className="logbook-list">
              {logbook.map((item) => (
                <li key={item.id} className="logbook-item">
                  <div className="meta">
                    <span className="badge">{item.entry_type}</span>
                    <time>{new Date(item.created).toLocaleString()}</time>
                    {item.location_text && (
                      <span
                        style={{
                          color: theme.colors.muted,
                          fontSize: theme.typography.fontSize.sm,
                        }}
                      >
                         {item.location_text}
                      </span>
                    )}
                    {item.author?.username && (
                      <span
                        style={{
                          color: theme.colors.muted,
                          fontSize: theme.typography.fontSize.sm,
                        }}
                      >
                        by @{item.author.username}
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/device/${id}/edit/${item.id}`)}
                      style={{
                        marginLeft: 'auto',
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        background: '#f3f4f6',
                        border: `${theme.borders.width} solid ${theme.colors.mutedLighter}`,
                        borderRadius: theme.borders.radius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        cursor: 'pointer',
                        color: theme.colors.textSecondary,
                        transition: theme.transitions.fast,
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text" style={{ marginTop: theme.spacing.md }}>
                    <ReactMarkdown>{item.text}</ReactMarkdown>
                  </div>
                  {item.modified && (
                    <div
                      style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}
                    >
                      Last modified: {new Date(item.modified).toLocaleString()}
                      {item.modified_by?.username && (
                        <span> by @{item.modified_by.username}</span>
                      )}
                    </div>
                  )}
                  {item.latitude && item.longitude ? (
                    <a
                      className="maplink"
                      href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on map
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

          <Button to={`/device/${id}/create`} style={{marginTop: theme.spacing.sm}}>
            Add Entry
          </Button>
      </Section>
    </PageLayout>
  )
}