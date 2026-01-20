export const Footer = () => {
	let commit = 'dev'
	let branch = 'unknown'
	
	try {
		if (import.meta.env && import.meta.env.VITE_GIT_COMMIT) {
			commit = String(import.meta.env.VITE_GIT_COMMIT)
		}
		if (import.meta.env && import.meta.env.VITE_GIT_BRANCH) {
			branch = String(import.meta.env.VITE_GIT_BRANCH)
		}
	} catch (e) {
		console.error('Failed to read git info:', e)
	}
	
	const short = commit && commit.length > 7 ? commit.slice(0, 7) : commit
	
	return (
		<footer className="footer">
			<div>{branch}@{short}</div>
		</footer>
	)
}
