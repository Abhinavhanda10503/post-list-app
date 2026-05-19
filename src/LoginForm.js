import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import './LoginForm.css';

function LoginForm({ onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="auth-modal">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to continue to SocialPost</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-accounts">
          <p className="demo-title">Demo Accounts (Click to test)</p>
          <div className="demo-buttons">
            <button 
              onClick={() => fillDemoCredentials('demo@example.com', 'demo123')}
              className="demo-btn"
              disabled={loading}
            >
              Demo User
            </button>
            <button 
              onClick={() => fillDemoCredentials('john@example.com', 'john123')}
              className="demo-btn"
              disabled={loading}
            >
              John Doe
            </button>
            <button 
              onClick={() => fillDemoCredentials('jane@example.com', 'jane123')}
              className="demo-btn"
              disabled={loading}
            >
              Jane Smith
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button onClick={onSwitchToRegister} className="switch-btn">
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;