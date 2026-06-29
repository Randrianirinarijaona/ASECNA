import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock, User, PlaneTakeoff, ShieldCheck, UserCircle,
  UserPlus, ArrowLeft, Eye, EyeOff, AlertCircle,
} from 'lucide-react';
import { useAuth, useToast } from '../../hooks';
import { validatePassword } from '../../utils/jwt';
import type { Role } from '../../types';
//import '../../App.css';
import './Login.css';

export default function Login() {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [adminKey, setAdminKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validateForm = (): string | null => {
    if (!username.trim() || username.length < 3) return 'Username must be at least 3 characters';
    if (isRegistering) {
      const pwErr = validatePassword(password);
      if (pwErr) return pwErr;
      if (password !== confirmPassword) return 'Passwords do not match';
      if (role === 'admin' && !adminKey.trim()) return 'Admin key is required';
    } else {
      if (!password) return 'Password is required';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await register({ username, password, confirmPassword, role, adminKey });
        showToast('Account created! Please log in.', 'success');
        setIsRegistering(false);
        setPassword(''); setConfirmPassword(''); setAdminKey('');
      } else {
        await login({ username, password });
        showToast(`Welcome back, ${username}!`, 'success');
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg-grid" />
        <div className="login-bg-glow" />
      </div>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-badge">
          </div>
          <h1 className="login-title">{isRegistering ? 'Create account' : 'ASECNA'}</h1>
          <p className="login-subtitle">
            {isRegistering ? 'Madagascar Terminals access' : 'Madagascar Terminals'}
          </p>
        </div>

        {/* Role tabs (registration only) */}
        {isRegistering && (
          <div className="role-tabs">
            <button
              type="button"
              className={`role-tab ${role === 'client' ? 'role-tab--active' : ''}`}
              onClick={() => setRole('client')}
            >
              <UserCircle size={16} />
              User
            </button>
            <button
              type="button"
              className={`role-tab ${role === 'admin' ? 'role-tab--active role-tab--admin' : ''}`}
              onClick={() => setRole('admin')}
            >
              <ShieldCheck size={16} />
              Admin
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="login-field">
            <label className="login-label">Username</label>
            <div className="login-input-wrap">
              <User className="login-input-icon" size={16} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                placeholder="Enter your username"
                required
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input-wrap">
              <Lock className="login-input-icon" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input login-input--padded"
                placeholder="••••••••"
                required
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {isRegistering && (
              <p className="login-hint">Min. 8 characters, one uppercase, one number</p>
            )}
          </div>

          {/* Confirm password */}
          {isRegistering && (
            <div className="login-field">
              <label className="login-label">Confirm password</label>
              <div className="login-input-wrap">
                <Lock className="login-input-icon" size={16} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="login-input"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {/* Admin key */}
          {isRegistering && role === 'admin' && (
            <div className="login-field">
              <label className="login-label login-label--admin">
                <Lock size={11} /> Admin security key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="login-input login-input--admin"
                placeholder="Enter the ASECNA admin key"
                required
              />
              <p className="login-hint">Required to create administrator accounts</p>
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Please wait…'
              : isRegistering
              ? 'Create account'
              : 'Sign in'}
          </button>
        </form>

        {/* Footer toggle */}
        <div className="login-footer">
          <button
            type="button"
            className="login-toggle"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
          >
            {isRegistering ? (
              <><ArrowLeft size={13} /> Back to sign in</>
            ) : (
              <>No account? <span>Create one</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}