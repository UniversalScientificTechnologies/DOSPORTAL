import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from './hooks/useAuthContext'

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
	const { isAuthed, isLoading } = useAuthContext()
	const location = useLocation()

	if (isLoading) {
		return null
	}

	if (!isAuthed) {
		return <Navigate to="/login" state={{ from: location }} replace />
	}

	return <>{children}</>
}
