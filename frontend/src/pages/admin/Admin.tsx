//admin.tsx
import { useCallback, useState } from 'react';
import {
  Users, ShieldCheck, UserCheck, Activity,
  Search, ToggleLeft, ToggleRight, Trash2, Edit,
} from 'lucide-react';
import { useToast } from '../../hooks';
import { userService, adminService } from '../../services/api.service';
import { useApi, useMutation } from '../../hooks/useApi';
import { Table, type Column } from '../../components/ui/Table';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import type { User } from '../../types';
// @ts-ignore: CSS module declaration not available in this project setup
import './Admin.css';

function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-icon" style={{ background: color }}>{icon}</div>
      <div>
        <div className="admin-stat-value">{value}</div>
        <div className="admin-stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'client'>('client');

  // Fetch stats
  const statsFetcher = useCallback(() => adminService.getStats(), []);
  const { data: stats } = useApi(statsFetcher);

  // Fetch users
  const usersFetcher = useCallback(
    () => userService.getAll(page, 10, search),
    [page, search]
  );
  const { data: usersData, isLoading, error, refetch } = useApi(usersFetcher, [page, search]);

  // Mutations
  const { execute: deleteUser, isLoading: deleting } = useMutation(userService.delete);
  const { execute: toggleActive } = useMutation(({ id, isActive }: { id: string; isActive: boolean }) =>
    userService.toggleActive(id, isActive)
  );
  const { execute: changeRole } = useMutation(({ id, role }: { id: string; role: 'admin' | 'client' }) =>
    userService.changeRole(id, role)
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteUser(deleteTarget.id);
    showToast(`User "${deleteTarget.username}" deleted`, 'success');
    setDeleteTarget(null);
    refetch();
  };

  const handleToggleActive = async (user: User) => {
    const result = await toggleActive({ id: user.id, isActive: !user.isActive });
    if (result) {
      showToast(
        `${user.username} ${result.isActive ? 'activated' : 'deactivated'}`,
        result.isActive ? 'success' : 'warning'
      );
      refetch();
    }
  };

  const handleEditRole = async () => {
    if (!editTarget) return;
    await changeRole({ id: editTarget.id, role: editRole });
    showToast(`Role updated to ${editRole}`, 'success');
    setEditTarget(null);
    refetch();
  };

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="user-cell">
          <div className="user-avatar-sm">{u.avatarInitials || u.username.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="user-name">{u.username}</div>
            {u.email && <div className="user-email">{u.email}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: '120px',
      render: (u) => (
        <span className={`badge badge-${u.role}`}>{u.role}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (u) => (
        <span className={`badge badge-${u.isActive ? 'active' : 'inactive'}`}>
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      width: '120px',
      render: (u) => (
        <span className="date-cell">
          {new Date(u.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '130px',
      render: (u) => (
        <div className="action-buttons">
          <button
            className="action-btn"
            title={u.isActive ? 'Deactivate' : 'Activate'}
            onClick={() => handleToggleActive(u)}
          >
            {u.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
          <button
            className="action-btn"
            title="Change role"
            onClick={() => { setEditTarget(u); setEditRole(u.role); }}
          >
            <Edit size={15} />
          </button>
          <button
            className="action-btn action-btn--danger"
            title="Delete user"
            onClick={() => setDeleteTarget(u)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page admin-page">
      <div className="page-header">
        <h1 className="page-title">Admin panel</h1>
        <p className="page-subtitle">Manage users, permissions and system settings</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="admin-stats">
          <StatCard label="Total users" value={stats.totalUsers}
            icon={<Users size={20} />} color="rgba(99,102,241,0.15)" />
          <StatCard label="Active users" value={stats.activeUsers}
            icon={<UserCheck size={20} />} color="rgba(34,197,94,0.15)" />
          <StatCard label="Admins" value={stats.adminCount}
            icon={<ShieldCheck size={20} />} color="rgba(245,158,11,0.15)" />
          <StatCard label="Recent logins" value={stats.recentLogins}
            icon={<Activity size={20} />} color="rgba(96,165,250,0.15)" />
        </div>
      )}

      {/* User management */}
      <div className="card">
        <div className="card-toolbar">
          <h2 className="card-title" style={{ marginBottom: 0 }}>User management</h2>
          <div className="toolbar-search">
            <Search size={15} className="search-icon" />
            <input
              type="search"
              placeholder="Search users…"
              className="form-input search-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={usersData?.items || []}
          isLoading={isLoading}
          error={error}
          emptyMessage="No users found"
          total={usersData?.total}
          page={page}
          pageSize={10}
          onPageChange={setPage}
        />
      </div>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete user"
        message={`Are you sure you want to permanently delete "${deleteTarget?.username}"? This cannot be undone.`}
        confirmLabel="Delete user"
        isLoading={deleting}
      />

      {/* Edit role modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Change role — ${editTarget?.username}`}
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setEditTarget(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditRole}>Save changes</button>
          </div>
        }
      >
        <div className="role-selector">
          {(['client', 'admin'] as const).map((r) => (
            <button
              key={r}
              className={`role-option ${editRole === r ? 'role-option--active' : ''}`}
              onClick={() => setEditRole(r)}
            >
              {r === 'admin' ? <ShieldCheck size={16} /> : <Users size={16} />}
              <span className="role-option-label">{r}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}