import { useEffect, useState } from 'react'

interface VersionInfo {
	git_commit: string
	git_branch: string
}

export const Footer = () => {
	const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
	const apiBase = (import.meta as any).env.VITE_API_URL || '/api'
	const gitCommit = (import.meta as any).env.VITE_GIT_COMMIT || 'unknown'
	const gitBranch = (import.meta as any).env.VITE_GIT_BRANCH || 'unknown'

	useEffect(() => {
		// Fetch backend version info
		fetch(`${apiBase}/version/`)
			.then(res => res.json())
			.then(data => setVersionInfo(data))
			.catch(() => {})
	}, [apiBase])

	const shortCommit = gitCommit.length > 7 ? gitCommit.substring(0, 7) : gitCommit
	const shortBackendCommit = versionInfo?.git_commit && versionInfo.git_commit.length > 7 
		? versionInfo.git_commit.substring(0, 7) 
		: versionInfo?.git_commit

	return (
		<footer style={{
			padding: '1rem',
			marginTop: 'auto',
			borderTop: '1px solid #ddd',
			fontSize: '0.85rem',
			color: '#666',
			textAlign: 'center'
		}}>
			<div>
				<strong>Frontend:</strong> {gitBranch}@{shortCommit}
				{versionInfo && (
					<> | <strong>Backend:</strong> {versionInfo.git_branch}@{shortBackendCommit}</>
				)}
			</div>
		</footer>
	)
}
