import { Outlet } from 'react-router-dom'
import { Layout } from '@/shared/components/Layout/Layout'
import { useAuthContext } from '@/features/auth/hooks/useAuthContext'

export function RouterLayout() {
	const { isLoading } = useAuthContext()
	if (isLoading) return null
	return <Layout><Outlet /></Layout>
}
