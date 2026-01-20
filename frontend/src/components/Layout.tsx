import { ReactNode } from 'react'

interface LayoutProps {
	children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
	const commit = import.meta.env.VITE_GIT_COMMIT || 'dev'
	const branch = import.meta.env.VITE_GIT_BRANCH || 'unknown'
	const short = commit && typeof commit === 'string' && commit.length > 7 ? commit.slice(0, 7) : commit
	
	return (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<main style={{ flex: 1 }}>
				{children}
			</main>
			<footer style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#666', borderTop: '1px solid #ddd' }}>
				{branch}@{short}
			</footer>
		</div>
	)
}
