export const Footer = () => {
	// Read git info from Vite environment variables (set at build time)
	const gitCommit = import.meta.env.VITE_GIT_COMMIT || 'dev'
	const gitBranch = import.meta.env.VITE_GIT_BRANCH || 'unknown'
	
	// Format commit hash - take first 7 chars if longer
	const shortCommit = gitCommit.length > 7 ? gitCommit.slice(0, 7) : gitCommit
	
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
				{gitBranch}@{shortCommit}
			</div>
		</footer>
	)
}
