import { useState } from 'react';
import { Sun, Moon, Monitor, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth, useTheme, useToast } from '../../hooks';
import { authService } from '../../services/api.service';
import { ConfirmModal } from '../../components/ui/Modal';
import type { ThemeMode } from '../../types';
import './Settings.css';

const THEMES: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun size={18} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={18} /> },
  { value: 'system', label: 'System', icon: <Monitor size={18} /> },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [pwError, setPwError] = useState('');
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmNew) { setPwError('Passwords do not match'); return; }

    setIsSavingPw(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      showToast('Password changed successfully', 'success');
      setCurrentPassword(''); setNewPassword(''); setConfirmNew('');
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setIsSavingPw(false);
    }
  };

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account preferences</p>
      </div>

      <div className="settings-sections">
        {/* Theme */}
        <div className="card settings-card">
          <h2 className="card-title">Appearance</h2>
          <p className="settings-desc">Choose how the interface looks to you</p>
          <div className="theme-options">
            {THEMES.map((t) => (
              <button
                key={t.value}
                className={`theme-option ${theme === t.value ? 'theme-option--active' : ''}`}
                onClick={() => {
                  setTheme(t.value);
                  showToast(`Theme set to ${t.label}`, 'info');
                }}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="card settings-card">
          <h2 className="card-title">
            <Lock size={16} /> Change password
          </h2>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current password</label>
              <input
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm new password</label>
              <input
                type="password"
                className="form-input"
                value={confirmNew}
                onChange={(e) => setConfirmNew(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {pwError && <p className="form-error">{pwError}</p>}
            <button type="submit" className="btn btn-primary" disabled={isSavingPw}>
              {isSavingPw ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </div>

        {/* Account info */}
        <div className="card settings-card">
          <h2 className="card-title">Account information</h2>
          <dl className="account-info">
            <dt>Username</dt><dd>{user?.username}</dd>
            <dt>Role</dt><dd><span className={`badge badge-${user?.role}`}>{user?.role}</span></dd>
            <dt>Status</dt><dd><span className="badge badge-active">Active</span></dd>
            <dt>Account ID</dt><dd className="mono">{user?.id || '—'}</dd>
          </dl>
        </div>

        {/* Danger zone */}
        <div className="card settings-card settings-card--danger">
          <h2 className="card-title danger-title">
            <AlertTriangle size={16} /> Danger zone
          </h2>
          <p className="settings-desc">Irreversible actions. Proceed with caution.</p>
          <div className="danger-actions">
            <div className="danger-item">
              <div>
                <div className="danger-item-title">Sign out everywhere</div>
                <div className="danger-item-desc">Revoke all active sessions</div>
              </div>
              <button className="btn btn-secondary" onClick={() => {
                logout();
                showToast('Signed out from all sessions', 'info');
              }}>
                Sign out
              </button>
            </div>
            <div className="danger-item">
              <div>
                <div className="danger-item-title">Delete account</div>
                <div className="danger-item-desc">Permanently remove your account and data</div>
              </div>
              <button
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} /> Delete account
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          showToast('Account deletion request sent', 'warning');
          setShowDeleteConfirm(false);
        }}
        title="Delete account"
        message="Are you sure you want to permanently delete your account? All data will be lost and this cannot be undone."
        confirmLabel="Delete my account"
      />
    </div>
  );
}