import { useState } from 'react'
import loginBg from '../assets/img/login_background.jpg'

export const LoginPage = ({
  onLogin,
}: {
  originBase: string
  onLogin: (username: string, password: string) => Promise<void>
}) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      await onLogin(username, password)
      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `linear-gradient(rgba(196, 196, 196, 0.5), rgba(255, 255, 255, 0)), url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, filter: 'blur(0)' }}>
      <div className="auth-layout single" style={{ width: '100%' }}>
        <section className="login-card" style={{ maxWidth: 500, margin: '0 auto' }}>
          <h1 className="h3 mb-3 fw-normal text-center" style={{ marginTop: 0, marginBottom: '1rem' }}>
            Please sign in
          </h1>

          {error && (
            <div className="error" role="alert" style={{ marginBottom: '0.75rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jdoe"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button className="primary" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Signing in…' : 'Sign in'}
            </button>

          </form>

          <div className="help" style={{ textAlign: 'center' }}>
            <small>
                Not registered yet?
            </small>
          </div>
        </section>
      </div>
      </div>
    </div>
  )
}
