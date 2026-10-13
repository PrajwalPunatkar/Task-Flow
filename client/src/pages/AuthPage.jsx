import { useState } from 'react'
import api from '../services/api.js'
import { useAuth } from '../auth/authContext.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

function Brand({ compact = false }) {
  return (
    <a className={`brand${compact ? ' mobile-brand' : ''}`} href="/login" aria-label="TaskFlow home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.2 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span>taskflow</span>
    </a>
  )
}

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { login } = useAuth()
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
    setSuccess('')
  }

  const validate = () => {
    if (isRegister && !values.name.trim()) return 'Please enter your name.'
    if (!emailPattern.test(values.email.trim())) return 'Enter a valid email address.'
    if (!values.password) return 'Please enter your password.'
    if (isRegister && !strongPassword.test(values.password)) {
      return 'Use at least 8 characters with uppercase, lowercase, and a number.'
    }
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    const email = values.email.trim().toLowerCase()
    try {
      if (isRegister) {
        await api.post('/auth/register', { name: values.name.trim(), email, password: values.password })
        setSuccess('Your account is ready. Sign in with your new credentials.')
        setValues({ name: '', email, password: '' })
      } else {
        const { data } = await api.post('/auth/login', { email, password: values.password })
        login(data.token, data.user)
        window.location.assign('/dashboard')
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reach TaskFlow. Check the server and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel" aria-label="About TaskFlow">
        <Brand />
        <div className="brand-copy">
          <p className="eyebrow">A calmer way to get things done</p>
          <h1>Make room for <span>meaningful work.</span></h1>
          <p>Bring your daily work into focus. TaskFlow helps you spend less time organizing and more time moving forward.</p>
        </div>
        <div className="brand-footer">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          Thoughtfully simple task management
        </div>
      </section>

      <section className="auth-main">
        <div className="auth-card">
          <Brand compact />
          <header className="auth-heading">
            <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p>{isRegister ? 'A more focused workday starts with a few details.' : 'Sign in to pick up where you left off.'}</p>
          </header>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isRegister && (
              <div className="field">
                <label htmlFor="name">Your name</label>
                <input id="name" name="name" type="text" autoComplete="name" placeholder="e.g. Alex Morgan" value={values.name} onChange={updateField} maxLength={100} required />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={values.email} onChange={updateField} maxLength={254} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'Create a strong password' : 'Enter your password'} value={values.password} onChange={updateField} required />
              {isRegister && <p className="field-hint">At least 8 characters, including uppercase, lowercase, and a number.</p>}
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {success && <p className="form-success" role="status">{success}</p>}
            <button className="submit-button" type="submit" disabled={loading}>
              {loading && <span className="spinner" aria-hidden="true" />}
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>
          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to TaskFlow?'}
            <a href={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</a>
          </p>
          <p className="auth-legal">By continuing, you agree to use TaskFlow responsibly.</p>
        </div>
      </section>
    </main>
  )
}

export default AuthPage
