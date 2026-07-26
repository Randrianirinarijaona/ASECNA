// pages/auth/Login.tsx
//
// MODIFIÉ (minimal) : la gestion du thème gérait jusqu'ici son propre état
// local + localStorage('theme'), indépendamment du reste de l'application.
// Depuis l'ajout de contexts/ThemeContext.tsx (nouveau fichier, cf. brief),
// Login.tsx utilise désormais useTheme() comme AppLayout.tsx et
// Settings.tsx, pour une seule source de vérité sur le thème. AUCUNE autre
// logique (authentification, validation du formulaire) n'est modifiée.
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock, User, ShieldCheck, UserCircle, GraduationCap,
  ArrowLeft, Eye, EyeOff, AlertCircle, Sun, Moon, CheckCircle2
} from 'lucide-react';
import { useAuth, useToast, useTheme } from '../../hooks';
import { validatePassword } from '../../utils/jwt';
import type { Role } from '../../types';
import './Login.css';

export default function Login() {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  // State Management
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [adminKey, setAdminKey] = useState('');
  const [validationCode, setValidationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Theme Management — délégué au ThemeContext partagé (cf. note ci-dessus).
  const { resolvedTheme, toggleTheme } = useTheme();

  const validateForm = (): string | null => {
    if (!username.trim() || username.length < 3) return 'Le nom d’utilisateur doit contenir au moins 3 caractères';
    if (isRegistering) {
      const pwErr = validatePassword(password);
      if (pwErr) return pwErr;
      if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas';
      if (role === 'admin' && !adminKey.trim()) return 'La clé administrateur est requise';
      if (role === 'technicien' && !validationCode.trim()) return 'Un code de validation est requis pour un compte Technicien';
    } else {
      if (!password) return 'Le mot de passe est requis';
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
        await register({ username, password, confirmPassword, role, adminKey, validationCode });
        showToast('Compte créé avec succès ! Veuillez vous connecter.', 'success');
        setIsRegistering(false);
        setPassword(''); setConfirmPassword(''); setAdminKey(''); setValidationCode('');
      } else {
        await login({ username, password });
        showToast(`Ravi de vous revoir, ${username} !`, 'success');
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-root">
      {/* Dynamic Background Overlay */}
      <div className="login-bg-overlay" aria-hidden="true" />

      {/* Floating Theme Switcher */}
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label="Changer de thème"
      >
        {resolvedTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="login-card">
        {/* Header with Brand Logo */}
        <div className="login-header">
          <div className="login-logo-container">
            <div className="login-badge" />
          </div>
          <h1 className="login-title">ASECNA</h1>
          <p className="login-subtitle">
            {isRegistering ? 'Création de compte — Terminaux Madagascar' : 'Agence pour la Sécurité de la Navigation Aérienne'}
          </p>
        </div>

        {/* Role Tabs Selection (Registration Only) */}
        {isRegistering && (
          <div className="role-tabs-container">
            <div className="role-tabs">
              <button
                type="button"
                className={`role-tab ${role === 'user' ? 'role-tab--active' : ''}`}
                onClick={() => setRole('user')}
              >
                <UserCircle size={15} />
                <span>Utilisateur</span>
              </button>
              <button
                type="button"
                className={`role-tab ${role === 'technicien' ? 'role-tab--active' : ''}`}
                onClick={() => setRole('technicien')}
              >
                <GraduationCap size={15} />
                <span>Technicien</span>
              </button>
              <button
                type="button"
                className={`role-tab ${role === 'admin' ? 'role-tab--active role-tab--admin' : ''}`}
                onClick={() => setRole('admin')}
              >
                <ShieldCheck size={15} />
                <span>Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="login-form">
          {/* Username Input */}
          <div className="login-field">
            <label className="login-label">Nom d'utilisateur</label>
            <div className="login-input-wrap">
              <User className="login-input-icon" size={16} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                placeholder="Ex: jean.dupont"
                required
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="login-field">
            <label className="login-label">Mot de passe</label>
            <div className="login-input-wrap">
              <Lock className="login-input-icon" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input login-input--password"
                placeholder="••••••••"
                required
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {isRegistering && (
              <p className="login-hint">8 caractères min, une majuscule, un chiffre.</p>
            )}
          </div>

          {/* Confirm Password Input */}
          {isRegistering && (
            <div className="login-field animate-fade-in">
              <label className="login-label">Confirmer le mot de passe</label>
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

          {/* Validation Code (Technicien Only) */}
          {isRegistering && role === 'technicien' && (
            <div className="login-field animate-fade-in">
              <label className="login-label login-label--accent">
                <CheckCircle2 size={13} /> Code de validation Technicien
              </label>
              <input
                type="text"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
                className="login-input login-input--special"
                placeholder="Entrez le code technique requis"
                required
              />
            </div>
          )}

          {/* Admin Security Key Input */}
          {isRegistering && role === 'admin' && (
            <div className="login-field animate-fade-in">
              <label className="login-label login-label--admin">
                <ShieldCheck size={13} /> Clé de sécurité Admin
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="login-input login-input--special login-input--admin"
                placeholder="Entrez la clé maître administrateur"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner-loader">Connexion en cours...</span>
            ) : isRegistering ? (
              'Créer le compte'
            ) : (
              'Se connecter au portail'
            )}
          </button>
        </form>

        {/* Footer Link Switcher */}
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
              <><ArrowLeft size={14} /> Retour à la page de connexion</>
            ) : (
              <>Nouveau sur le réseau ? <span>Créer un compte</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
