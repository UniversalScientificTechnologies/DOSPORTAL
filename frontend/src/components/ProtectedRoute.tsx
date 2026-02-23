import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Wraps a route that requires authentication.
 * While auth state is loading, renders nothing to avoid flash of content.
 * Once resolved, redirects unauthenticated users to /login.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthed, isLoading } = useAuthContext()

  if (isLoading) {
    return null
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
