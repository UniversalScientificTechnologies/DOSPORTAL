import { createContext } from 'react'

export interface AuthContextValue {
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

export const AuthContext = createContext<AuthContextValue | null>(null)
