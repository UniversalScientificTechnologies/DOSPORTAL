import { useState, useEffect, useCallback, type ReactNode } from 'react'
import axios from 'axios'
import { loginCreate, logoutCreate, signupCreate } from '@/api/authentication/authentication'
import { AuthContext } from './AuthContext'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [isAuthed, setIsAuthed] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [token, setToken] = useState<string | null>(null)

	const applyToken = useCallback((t: string | null) => {
		if (t) {
			axios.defaults.headers.common['Authorization'] = `Token ${t}`
		} else {
			delete axios.defaults.headers.common['Authorization']
		}
	}, [])

	useEffect(() => {
		const storedToken = localStorage.getItem('authToken')
		if (storedToken) {
			setToken(storedToken)
			applyToken(storedToken)
			setIsAuthed(true)
		}
		setIsLoading(false)
	}, [applyToken])

	const login = async (username: string, password: string) => {
		try {
			const res = await loginCreate({ username, password })
			const newToken = res.data.token
			localStorage.setItem('authToken', newToken)
			setToken(newToken)
			applyToken(newToken)
			setIsAuthed(true)
		} catch (err) {
			if (axios.isAxiosError(err)) {
				throw new Error(err.response?.data?.detail || 'Login failed')
			}
			throw new Error('Login failed')
		}
	}

	const signup = async (
		username: string,
		firstName: string,
		lastName: string,
		password: string,
		password_confirm: string,
		email: string,
	) => {
		try {
			await signupCreate({
				username,
				first_name: firstName,
				last_name: lastName,
				email,
				password,
				password_confirm,
			})
		} catch (err) {
			if (axios.isAxiosError(err)) {
				throw new Error(err.response?.data?.detail || 'Signup failed')
			}
			throw new Error('Signup failed')
		}
	}

	const logout = async () => {
		try {
			await logoutCreate()
		} catch (e) {
			console.error('Logout error:', e)
		} finally {
			localStorage.removeItem('authToken')
			setToken(null)
			applyToken(null)
			setIsAuthed(false)
		}
	}

	const getAuthHeader = useCallback((): { Authorization?: string } => {
		return token ? { Authorization: `Token ${token}` } : {}
	}, [token])

	return (
		<AuthContext.Provider value={{ isAuthed, isLoading, token, login, signup, logout, getAuthHeader }}>
			{children}
		</AuthContext.Provider>
	)
}
