import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../Loginform/LoginForm.css';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

type FormKey = keyof FormState;

function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { register } = useAuth();

  const set = (k: FormKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
  };

  const validate = (): boolean => {
    if (form.name.length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }
    if (!form.email.includes('@')) {
      setError('Enter a valid email');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields: Array<{
    label: string;
    key: FormKey;
    type: string;
    placeholder: string;
  }> = [
    { label: 'Full name', key: 'name', type: 'text', placeholder: 'Your name' },
    { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
    { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
    { label: 'Confirm password', key: 'confirm', type: 'password', placeholder: 'Repeat password' },
  ];

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-mark">✍️</div>
          <span className="auth-logo-name">SocialPost</span>
        </div>
        <div className="auth-card">
          <h1 className="auth-heading">Create account</h1>
          <p className="auth-subheading">Join the community today</p>
          {error && <div className="auth-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            {fields.map(({ label, key, type, placeholder }) => (
              <div key={key} className="form-field">
                <label className="form-label">{label}</label>
                <input
                  type={type}
                  className="form-input"
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  required
                  disabled={loading}
                />
              </div>
            ))}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
        <div className="auth-switch">
          Already have an account?
          <button className="auth-switch-btn" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;