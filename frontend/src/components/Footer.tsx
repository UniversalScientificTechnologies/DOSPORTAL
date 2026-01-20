export const Footer = () => {
	const commit = import.meta.env.VITE_GIT_COMMIT || 'dev'
	const branch = import.meta.env.VITE_GIT_BRANCH || 'unknown'
	const short = commit.length > 7 ? commit.slice(0, 7) : commit
	
	return (
		<footer className="footer">
			<div>{branch}@{short}</div>
		</footer>
	)
}
