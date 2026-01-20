import { ReactNode } from 'react'
import { Navbar } from './Navbar'

interface LayoutProps {
	children: ReactNode
	isAuthed: boolean
	onLogout: () => Promise<void>
}

export const Layout = ({ children, isAuthed, onLogout }: LayoutProps) => {
	const commit = import.meta.env.VITE_GIT_COMMIT || 'dev'
	const branch = import.meta.env.VITE_GIT_BRANCH || 'unknown'
	const short = commit && typeof commit === 'string' && commit.length > 7 ? commit.slice(0, 7) : commit
	
	return (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<Navbar isAuthed={isAuthed} onLogout={onLogout} />
			<main style={{ flex: 1 }}>
				{children}
			</main>
			<footer style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#666', borderTop: '1px solid #ddd' }}>
				{branch}@{short}
			</footer>
		</div>
	)
}
