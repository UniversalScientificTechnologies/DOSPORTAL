import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

interface AuthContextValue {
  API_BASE: string
  ORIGIN_BASE: string
  isAuthed: boolean
  isLoading: boolean
  token: string | null
  login: (username: string, password: string) => Promise<void>
  signup: (
    username: string,
    firstName: string,
    lastName: string,
    password: string,
    password_confirm: string,
    email: string,
  ) => Promise<void>
  logout: () => Promise<void>
  getAuthHeader: () => { Authorization?: string }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider')
  }
  return ctx
}
