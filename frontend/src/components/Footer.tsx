export const Footer = () => {
	const commit = 'test123'
	const branch = 'master'
	const short = commit.substring(0, 7)
	
	return (
		<footer className="footer">
			<div>{branch}@{short}</div>
		</footer>
	)
}
