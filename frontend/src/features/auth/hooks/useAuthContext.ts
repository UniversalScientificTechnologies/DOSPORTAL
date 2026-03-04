import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

type AuthContextValue = NonNullable<React.ContextType<typeof AuthContext>>

export const useAuthContext = (): AuthContextValue => {
	const ctx = useContext(AuthContext)
	if (!ctx) {
		throw new Error('useAuthContext must be used inside AuthProvider')
	}
	return ctx
}
