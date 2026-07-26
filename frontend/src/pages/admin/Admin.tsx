// pages/admin/Admin.tsx
//
// NOUVEAU FICHIER : référencé par routes.tsx (<Route path="/admin"
// element={<Admin />} />, protégé par <AdminRoute>) mais absent des
// fichiers fournis. Page minimale mais fonctionnelle : statistiques
// globales (adminService.getStats), gestion des utilisateurs (activation,
// changement de rôle, suppression) et journal d'activité
// (adminService.getLogs), en réutilisant les composants UI déjà présents
// dans le projet (Modal/ConfirmModal, Spinner) et le style utilitaire
// existant (cards, badges) plutôt que d'introduire un nouveau design.
import { useEffect, useState, useCallback } from 'react';
import { Users, Plane, Network, Radio, Shield, Trash2 } from 'lucide-react';
import { useAuth, useToast } from '../../hooks';
import { adminService, userService } from '../../services/api.service';
import { ConfirmModal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import type { AdminStats, ActivityLog, User, Role } from '../../types';
// @ts-ignore: CSS side-effect import handled by build tooling
import './Admin.css';

export default function Admin() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        adminService.getStats(),
        userService.getAll(1, 50),
        adminService.getLogs(1, 20),
      ]);
      setStats(statsRes);
      setUsers(usersRes.items);
      setLogs(logsRes.items);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      const updated = await userService.changeRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      showToast('Rôle mis à jour', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      const updated = await userService.toggleActive(u.id, !u.isActive);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      showToast(updated.isActive ? 'Compte activé' : 'Compte désactivé', 'info');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await userService.delete(pendingDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id));
      showToast('Utilisateur supprimé', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setPendingDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="page admin-page admin-page--loading">
        <Spinner size="lg" label="Chargement du panneau admin…" />
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <div className="page-header">
        <h1 className="page-title">Administration</h1>
        <p className="page-subtitle">Gestion des utilisateurs et supervision du réseau</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}><Users size={20} /></div>
            <div className="stat-body">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Utilisateurs ({stats.activeUsers} actifs)</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)' }}><Plane size={20} /></div>
            <div className="stat-body">
              <div className="stat-value">{stats.totalAirports}</div>
              <div className="stat-label">Aéroports</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}><Radio size={20} /></div>
            <div className="stat-body">
              <div className="stat-value">{stats.totalTechnicalPoints}</div>
              <div className="stat-label">Points techniques</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(96,165,250,0.12)' }}><Network size={20} /></div>
            <div className="stat-body">
              <div className="stat-value">{stats.totalLinks}</div>
              <div className="stat-label">Liaisons</div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Utilisateurs</h2>
        </div>
        <div className="card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email || '—'}</td>
                  <td>
                    <select
                      className="form-input"
                      value={u.role}
                      disabled={u.id === currentUser?.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                    >
                      <option value="admin">admin</option>
                      <option value="technicien">technicien</option>
                      <option value="user">user</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className={`badge-status badge-status--${u.isActive ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActive(u)}
                      disabled={u.id === currentUser?.id}
                    >
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td>
                    <button
                      className="icon-btn icon-btn--danger icon-btn--sm"
                      title="Supprimer"
                      disabled={u.id === currentUser?.id}
                      onClick={() => setPendingDelete(u)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <Shield size={16} /> Journal d'activité
          </h2>
        </div>
        <div className="card activity-card">
          {logs.length === 0 && <p className="network-empty">Aucune activité enregistrée</p>}
          {logs.map((log) => (
            <div key={log.id} className="activity-item">
              <span className="activity-time">{new Date(log.createdAt).toLocaleString('fr-FR')}</span>
              <span className="activity-msg">{log.action}</span>
              <span className="activity-tag">{log.username}</span>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Voulez-vous vraiment supprimer le compte "${pendingDelete?.username}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
