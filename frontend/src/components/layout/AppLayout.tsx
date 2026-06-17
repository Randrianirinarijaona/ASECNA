import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Map, LayoutDashboard, User, Settings, Shield,
  LogOut, Bell, Menu, X, Sun, Moon, ChevronDown,
} from 'lucide-react';
import { useAuth, useTheme, useToast } from '../../hooks';
import { ToastStack } from '../ui/ToastStack';
import './AppLayout.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('You have been logged out', 'info');
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: <Map size={18} />, label: 'Map' },
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/profile', icon: <User size={18} />, label: 'Profile' },
    { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
    ...(user?.role === 'admin'
      ? [{ to: '/admin', icon: <Shield size={18} />, label: 'Admin' }]
      : []),
  ];

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="nav-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Navigation sidebar */}
      <nav className="app-nav" role="navigation" aria-label="Main navigation">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">✈</span>
            <span className="brand-name">ASECNA</span>
          </Link>
          <button
            className="nav-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="nav-items">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="nav-footer">
          <button
            className="nav-item nav-item--logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <div className="app-main">

        {/* Top bar */}
        <header className="app-topbar">
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="topbar-right">
            {/* Theme toggle */}
            <button
              className="topbar-action"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <button
              className="topbar-action topbar-action--bell"
              onClick={() => showToast('Notifications coming soon', 'info')}
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="notif-dot" aria-hidden="true" />
            </button>

            {/* Profile dropdown */}
            <div className="profile-dropdown">
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <div className="avatar">{user?.avatarInitials}</div>
                <div className="profile-info">
                  <span className="profile-name">{user?.username}</span>
                  <span className="profile-role">{user?.role}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`profile-caret ${profileOpen ? 'rotated' : ''}`}
                />
              </button>

              {profileOpen && (
                <div
                  className="profile-menu"
                  role="menu"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <Link to="/profile" className="profile-menu-item" role="menuitem"
                    onClick={() => setProfileOpen(false)}>
                    <User size={15} /> My profile
                  </Link>
                  <Link to="/settings" className="profile-menu-item" role="menuitem"
                    onClick={() => setProfileOpen(false)}>
                    <Settings size={15} /> Settings
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="profile-menu-item" role="menuitem"
                      onClick={() => setProfileOpen(false)}>
                      <Shield size={15} /> Admin panel
                    </Link>
                  )}
                  <hr className="profile-divider" />
                  <button className="profile-menu-item profile-menu-item--danger"
                    role="menuitem" onClick={handleLogout}>
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="app-content">
          {children}
        </main>
      </div>

      <ToastStack />
    </div>
  );
}