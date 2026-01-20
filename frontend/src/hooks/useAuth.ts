import { useMemo, useState, useEffect } from 'react'

export const useAuth = () => {
	const { API_BASE, ORIGIN_BASE } = useMemo(() => {
		const api = (import.meta as any).env.VITE_API_URL || '/api'
		return {
			API_BASE: api,
			ORIGIN_BASE: api.replace(/\/?api\/?$/, ''),
		}
	}, [])

	const [isAuthed, setIsAuthed] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [token, setToken] = useState<string | null>(null)

	// Check if token exists in localStorage on mount
	useEffect(() => {
		const storedToken = localStorage.getItem('authToken')
		if (storedToken) {
			setToken(storedToken)
			setIsAuthed(true)
		}
		setIsLoading(false)
	}, [])

	const login = async (username: string, password: string) => {
		const res = await fetch(`${API_BASE}/login/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username, password }),
		})

		if (res.ok) {
			const data = await res.json()
			const newToken = data.token
			localStorage.setItem('authToken', newToken)
			setToken(newToken)
			setIsAuthed(true)
			return
		}

		const data = await res.json().catch(() => ({ detail: 'Login failed' }))
		throw new Error(data.detail || `Login failed (HTTP ${res.status})`)
	}

	const logout = async () => {
		if (!token) return

		try {
			await fetch(`${API_BASE}/logout/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Token ${token}`,
				},
			})
		} catch (e) {
			console.error('Logout error:', e)
		} finally {
			localStorage.removeItem('authToken')
			setToken(null)
			setIsAuthed(false)
		}
	}

	// Helper to get Authorization header for authenticated requests
	const getAuthHeader = () => {
		return token ? { 'Authorization': `Token ${token}` } : {}
	}

	return {
		API_BASE,
		ORIGIN_BASE,
		isAuthed,
		isLoading,
		token,
		login,
		logout,
		getAuthHeader,
	}
}
}
