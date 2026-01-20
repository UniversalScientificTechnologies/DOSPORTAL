export const VersionInfo = () => {
	const commit = import.meta.env.VITE_GIT_COMMIT || 'dev'
	const branch = import.meta.env.VITE_GIT_BRANCH || 'unknown'
	const short = commit && typeof commit === 'string' && commit.length > 7 ? commit.slice(0, 7) : commit
	
	return (
		<div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#666', borderTop: '1px solid #ddd' }}>
			{branch}@{short}
		</div>
	)
}
