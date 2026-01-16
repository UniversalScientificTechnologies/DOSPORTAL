import { useMemo, useState, useEffect } from 'react'

const getCookie = (name: string) => {
	const value = `; ${document.cookie}`
	const parts = value.split(`; ${name}=`)
	if (parts.length === 2) return parts.pop()!.split(';').shift() || ''
	return ''
}

const ensureCsrfCookie = async (originBase: string) => {
	await fetch(`${originBase}/login/`, { method: 'GET', credentials: 'include' })
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
		await ensureCsrfCookie(ORIGIN_BASE)
		const csrftoken = getCookie('csrftoken')

		const form = new URLSearchParams()
		form.set('username', username)
		form.set('password', password)

		const res = await fetch(`${ORIGIN_BASE}/login/`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-CSRFToken': csrftoken || '',
			},
			body: form.toString(),
			redirect: 'follow',
		})

		if (res.ok || res.status === 302) {
			setIsAuthed(true)
			return
		}

		const txt = await res.text()
		throw new Error(`Login failed (HTTP ${res.status}): ${txt.slice(0, 200)}`)
	}

	const logout = async () => {
		await ensureCsrfCookie(ORIGIN_BASE)
		const csrftoken = getCookie('csrftoken')
		await fetch(`${ORIGIN_BASE}/logout/`, {
			method: 'GET',
			credentials: 'include',
			headers: {
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
