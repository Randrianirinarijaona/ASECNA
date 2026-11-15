import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Lock, Trash2, AlertTriangle, KeyRound } from 'lucide-react';
import { useAuth, useTheme, useToast } from '../../hooks';
import { authService, adminService } from '../../services/api.service';
import { ConfirmModal } from '../../components/ui/Modal';
import type { ThemeMode } from '../../types';
// @ts-ignore: CSS side-effect import handled by build tooling
import './Settings.css';

const THEMES: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun size={18} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={18} /> },
  { value: 'system', label: 'System', icon: <Monitor size={18} /> },
];

// Mêmes bornes que le backend (routers/admin.py).
const KEY_MIN_LENGTH = 8;
const KEY_MAX_LENGTH = 100;

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

  // ─── Clés d'inscription (administrateur uniquement) ───────────────────
  const isAdmin = user?.role === 'admin';
  const [savedKeys, setSavedKeys] = useState<{ adminKey: string; technicienCode: string } | null>(null);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [techCodeInput, setTechCodeInput] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [keysError, setKeysError] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    adminService
      .getRegistrationKeys()
      .then((keys) => {
        if (cancelled) return;
        setSavedKeys(keys);
        setAdminKeyInput(keys.adminKey);
        setTechCodeInput(keys.technicienCode);
      })
      .catch((err) => {
        if (!cancelled) setKeysError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const adminKeyChanged = savedKeys !== null && adminKeyInput.trim() !== savedKeys.adminKey;
  const techCodeChanged = savedKeys !== null && techCodeInput.trim() !== savedKeys.technicienCode;

  const validateKey = (value: string, label: string): string | null => {
    const v = value.trim();
    if (v.length < KEY_MIN_LENGTH) return `${label} doit contenir au moins ${KEY_MIN_LENGTH} caractères`;
    if (v.length > KEY_MAX_LENGTH) return `${label} ne doit pas dépasser ${KEY_MAX_LENGTH} caractères`;
    return null;
  };

  const handleKeysSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeysError('');

    const payload: { adminKey?: string; technicienCode?: string } = {};
    if (adminKeyChanged) {
      const err = validateKey(adminKeyInput, 'La clé de sécurité Admin');
      if (err) { setKeysError(err); return; }
      payload.adminKey = adminKeyInput.trim();
    }
    if (techCodeChanged) {
      const err = validateKey(techCodeInput, 'Le code de validation technicien');
      if (err) { setKeysError(err); return; }
      payload.technicienCode = techCodeInput.trim();
    }
    if (!payload.adminKey && !payload.technicienCode) return;

    setIsSavingKeys(true);
    try {
      const updated = await adminService.updateRegistrationKeys(payload);
      setSavedKeys(updated);
      setAdminKeyInput(updated.adminKey);
      setTechCodeInput(updated.technicienCode);
      showToast("Clés d'inscription mises à jour", 'success');
    } catch (err) {
      setKeysError((err as Error).message);
    } finally {
      setIsSavingKeys(false);
    }
  };

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

        <div className="card settings-card">
          <h2 className="card-title-iconic">
            <Lock size={18} /> Change password
          </h2>
          <form onSubmit={handlePasswordChange} className="settings-form">
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
            <button type="submit" className="btn btn-primary settings-submit-btn" disabled={isSavingPw}>
              {isSavingPw ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </div>

        {isAdmin && (
          <div className="card settings-card">
            <h2 className="card-title-iconic">
              <KeyRound size={18} /> Clés d'inscription
            </h2>
            <p className="settings-desc">
              Valeurs exigées pour créer un compte Admin ou Technicien. Le changement est immédiat
              et ne concerne que les futures inscriptions.
            </p>
            <form onSubmit={handleKeysSave} className="settings-form">
              <div className="form-group">
                <label className="form-label">Clé de sécurité Admin</label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  className="form-input"
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  disabled={savedKeys === null}
                  autoComplete="off"
                  maxLength={KEY_MAX_LENGTH}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Code de validation technicien</label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  className="form-input"
                  value={techCodeInput}
                  onChange={(e) => setTechCodeInput(e.target.value)}
                  disabled={savedKeys === null}
                  autoComplete="off"
                  maxLength={KEY_MAX_LENGTH}
                />
              </div>
              {keysError && <p className="form-error">{keysError}</p>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowKeys((v) => !v)}
                  disabled={savedKeys === null}
                >
                  {showKeys ? 'Masquer' : 'Afficher'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary settings-submit-btn"
                  disabled={isSavingKeys || (!adminKeyChanged && !techCodeChanged)}
                >
                  {isSavingKeys ? 'Enregistrement…' : 'Enregistrer les clés'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card settings-card">
          <h2 className="card-title">Account information</h2>
          <dl className="account-info">
            <div className="info-row"><dt>Username</dt><dd>{user?.username}</dd></div>
            <div className="info-row"><dt>Role</dt><dd><span className={`badge-role badge-role--${user?.role}`}>{user?.role}</span></dd></div>
            <div className="info-row"><dt>Status</dt><dd><span className="badge-status badge-status--active">Active</span></dd></div>
            <div className="info-row"><dt>Account ID</dt><dd className="mono">{user?.id || '—'}</dd></div>
          </dl>
        </div>

        <div className="card settings-card settings-card--danger">
          <h2 className="card-title danger-title">
            <AlertTriangle size={18} /> Danger zone
          </h2>
          <p className="settings-desc">Irreversible actions. Proceed with caution.</p>
          <div className="danger-actions">
            <div className="danger-item">
              <div className="danger-item-text">
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
              <div className="danger-item-text">
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