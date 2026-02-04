import loginBg from '../assets/img/login_background.jpg'
import { theme } from '../theme'

export const SignupSuccessPage = () => {
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
          <section className="login-card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <h1 className="h3 mb-3 fw-normal text-center" style={{ marginTop: 0, marginBottom: '1rem' }}>
              Registration successful
            </h1>

            <p style={{ marginBottom: theme.spacing.md }}>
              Your registration was successful. Your account must be approved by an administrator
              before you can sign in.
            </p>

            <p style={{ marginBottom: theme.spacing.lg }}>
              After approval, you will receive an email notification. :Copium:
            </p>

            <div style={{ textAlign: 'center' }}>
              <a className="primary" href="/login" style={{ padding: '10px 22px', display: 'inline-block' }}>
                Go to Sign in
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
