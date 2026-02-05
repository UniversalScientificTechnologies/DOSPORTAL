import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import loginBg from '../assets/img/login_background.jpg'
import { theme } from '../theme'

export const SignupPage = ({
  onSignup,
}: {
  originBase: string
  onSignup: (
    username: string,
    firstName: string,
    lastName: string,
    password: string,
    passwordConfirm: string,
    email: string,
  ) => Promise<void>
}) => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      await onSignup(username, firstName, lastName, password, passwordConfirm, email)
      setStatus('success')
      navigate('/signup/success')
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
            Create account
          </h1>

          {error && (
            <div className="error" role="alert" style={{ marginBottom: theme.spacing.md }}>
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
              <label htmlFor="first_name">First name</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="last_name">Last name</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password_confirm">Confirm Password</label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button className="primary" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Creating account…' : 'Sign up'}
            </button>

          </form>

          <div className="help" style={{ textAlign: 'center' }}>
            <small>
                Already have an account? <a href="/login">Sign in here</a>
            </small>
          </div>
        </section>
      </div>
      </div>
    </div>
  )
}
