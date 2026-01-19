import { useMemo, useState, useEffect } from 'react'

const getCookie = (name: string) => {
	const value = `; ${document.cookie}`
	const parts = value.split(`; ${name}=`)
	if (parts.length === 2) return parts.pop()!.split(';').shift() || ''
	return ''
}

const ensureCsrfCookie = async (apiBase: string) => {
	// For API endpoints, we need to fetch from a safe endpoint to get CSRF token
	await fetch(`${apiBase}/detector/`, { method: 'GET', credentials: 'include' }).catch(() => {})
}

export const useAuth = () => {
	const { API_BASE, ORIGIN_BASE } = useMemo(() => {
		const api = (import.meta as any).env.VITE_API_URL || 'http://web:8000/api'
		return {
			API_BASE: api,
			ORIGIN_BASE: api.replace(/\/?api\/?$/, ''),
		}
	}, [])

	const [isAuthed, setIsAuthed] = useState(false)
	const [isLoading, setIsLoading] = useState(true)

	// Check if user is already authenticated on mount
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const res = await fetch(`${API_BASE}/detector/`, {
					method: 'GET',
					credentials: 'include',
				})
				// If we can access a protected endpoint, user is authenticated
				setIsAuthed(res.ok)
			} catch (e) {
				setIsAuthed(false)
			} finally {
				setIsLoading(false)
			}
		}

		checkAuth()
	}, [API_BASE])

	const login = async (username: string, password: string) => {
		await ensureCsrfCookie(API_BASE)
		const csrftoken = getCookie('csrftoken')

		const res = await fetch(`${API_BASE}/login/`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrftoken || '',
			},
			body: JSON.stringify({ username, password }),
		})

		if (res.ok) {
			setIsAuthed(true)
			return
		}

		const data = await res.json().catch(() => ({ detail: 'Login failed' }))
		throw new Error(data.detail || `Login failed (HTTP ${res.status})`)
	}

	const logout = async () => {
		const csrftoken = getCookie('csrftoken')
		await fetch(`${API_BASE}/logout/`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrftoken || '',
			},
		})
		setIsAuthed(false)
	}

	return {
		API_BASE,
		ORIGIN_BASE,
		isAuthed,
		isLoading,
		login,
		logout,
	}
}
