import { Outlet } from 'react-router-dom'
import { Layout } from './Layout'
import { useAuthContext } from '@/features/auth/hooks/useAuthContext'

export function RouterLayout() {
	const { isLoading } = useAuthContext()
	if (isLoading) return null
	return <Layout><Outlet /></Layout>
}
