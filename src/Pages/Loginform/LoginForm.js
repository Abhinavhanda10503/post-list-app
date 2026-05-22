import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './LoginForm.css'

function LoginForm({ onSwitchToRegister }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login }               = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!email.trim())    return setError('Please enter your email')
    if (!password.trim()) return setError('Please enter your password')
    setLoading(true)
    try { await login(email, password) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const fill = (e, p) => { setEmail(e); setPassword(p) }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-mark">✍️</div>
          <span className="auth-logo-name">SocialPost</span>
        </div>
        <div className="auth-card">
          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-subheading">Sign in to continue</p>
          {error && <div className="auth-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required disabled={loading} autoComplete="email" />
            </div>
            <div className="form-field">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <div className="auth-divider" />
          <p className="demo-section-title">Quick demo accounts</p>
          <div className="demo-chips">
            {[['Demo User','demo@example.com','demo123'],['John Doe','john@example.com','john123'],['Jane Smith','jane@example.com','jane123']].map(([label, e, p]) => (
              <button key={label} className="demo-chip" onClick={() => fill(e, p)} disabled={loading}>{label}</button>
            ))}
          </div>
        </div>
        <div className="auth-switch">Don't have an account?<button className="auth-switch-btn" onClick={onSwitchToRegister}>Create one</button></div>
      </div>
    </div>
  )
}

export default LoginForm