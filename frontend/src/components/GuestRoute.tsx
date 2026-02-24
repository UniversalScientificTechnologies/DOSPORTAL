import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export const GuestRoute = ({ children }: { children: ReactNode }) => {
	const { isAuthed } = useAuthContext()

	if (isAuthed) {
		return <Navigate to="/" replace />
	}

	return <>{children}</>
}
