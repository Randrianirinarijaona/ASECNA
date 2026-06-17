import { useState } from 'react';
import { User, Mail, Calendar, Shield, Save } from 'lucide-react';
import { useAuth, useToast } from '../../hooks';
import { userService } from '../../services/api.service';
import { getInitials } from '../../utils/jwt';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const updated = await userService.update(user.id, { username, email });
      updateUser({ ...updated, avatarInitials: getInitials(updated.username) });
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page profile-page">
      <div className="page-header">
        <h1 className="page-title">My profile</h1>
        <p className="page-subtitle">Manage your personal information</p>
      </div>

      <div className="profile-grid">
        {/* Avatar card */}
        <div className="card profile-avatar-card">
          <div className="profile-avatar-large">
            {user?.avatarInitials}
          </div>
          <div className="profile-avatar-name">{user?.username}</div>
          <div className="profile-avatar-role">
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
          <div className="profile-meta">
            <div className="profile-meta-item">
              <Calendar size={14} />
              <span>Joined {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                  month: 'long', year: 'numeric',
                })
                : '—'}
              </span>
            </div>
            {user?.lastLogin && (
              <div className="profile-meta-item">
                <Shield size={14} />
                <span>Last login {new Date(user.lastLogin).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Edit form */}
        <div className="card profile-form-card">
          <h2 className="card-title">Personal information</h2>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">
                <User size={13} /> Username
              </label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <Mail size={13} /> Email address
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <Shield size={13} /> Account role
              </label>
              <input
                type="text"
                className="form-input"
                value={user?.role}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                Contact an administrator to change your role
              </p>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              <Save size={15} />
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}