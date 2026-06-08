//Login.jsx

import { useState } from 'react';
import {
  Lock,
  User,
  PlaneTakeoff,
  ShieldCheck,
  UserCircle,
  UserPlus,
  ArrowLeft,
} from 'lucide-react';
import '../../App.css';
const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('client');
  const [adminKey, setAdminKey] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isRegistering ? 'register' : 'login';
    const body = isRegistering 
      ? { username, password, role, admin_key: adminKey }
      : { username, password };

    try {
      const response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Une erreur est survenue");
        return;
      }

      if (isRegistering) {
        alert("Inscription réussie !");
        setIsRegistering(false);
      } else {
        onLogin(data.username, data.role);
      }
    } catch {
      alert("Impossible de contacter le serveur.");
    }
  };

  return (
    <div className="login-root-container">
      <div className="login-card">
        {/* En-tête */}
        <div className="login-header">
          <div className="login-icon-badge">
            {isRegistering ? (
              <UserPlus size={28} />
            ) : (
              <PlaneTakeoff size={28} />
            )}
          </div>

          <h1 className="login-title">
            {isRegistering ? 'Inscription' : 'ASECNA'}
          </h1>

          <p className="login-subtitle">
            {isRegistering ? 'Créer un nouvel accès' : 'Madagascar Terminals'}
          </p>
        </div>

        {/* Sélecteur de rôle */}
        <div className="role-selector-container">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`role-tab ${role === 'client' ? 'active-client' : ''}`}
          >
            <UserCircle size={18} />
            Client
          </button>

          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`role-tab ${role === 'admin' ? 'active-admin' : ''}`}
          >
            <ShieldCheck size={18} />
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Identifiant */}
          <div className="form-group">
            <label className="form-label">Identifiant</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="Nom d'utilisateur"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Confirmation mot de passe */}
          {isRegistering && (
            <div className="form-group animate-slide-down">
              <label className="form-label">Confirmer le mot de passe</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {/* Clé admin */}
          {isRegistering && role === 'admin' && (
            <div className="form-group animate-zoom-in">
              <label className="form-label admin-label">
                <Lock size={11} />
                Clé de sécurité Administrateur
              </label>
              <input
                type="password"
                required
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="form-input admin-input"
                placeholder="Entrez le code secret ASECNA"
              />
              <p className="form-help-text">
                * Requis pour créer un compte avec privilèges élevés.
              </p>
            </div>
          )}

          <button type="submit" className="btn-submit-login">
            {isRegistering ? "Confirmer l'inscription" : 'Se connecter'}
          </button>
        </form>

        {/* Bascule login/register */}
        <div className="login-footer">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="toggle-register-btn"
          >
            {isRegistering ? (
              <>
                <ArrowLeft size={14} />
                Retour à la connexion
              </>
            ) : (
              <>
                Pas de compte ?{' '}
                <span className="accent-text">Créer un accès</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;