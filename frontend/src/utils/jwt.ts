import type { User } from '../types';

const TOKEN_KEY = 'asecna_access_token';
const USER_KEY = 'asecna_user';

// ─── Token Storage ────────────────────────────────────────────────────────────

export const saveToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ─── User Storage ─────────────────────────────────────────────────────────────

export const saveUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

// ─── Token Parsing ────────────────────────────────────────────────────────────

interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
  iat: number;
}

export const parseJwt = (token: string): JwtPayload | null => {
  try {
    const base64 = token.split('.')[1];
    const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = parseJwt(token);
  if (!payload) return true;
  return Date.now() / 1000 > payload.exp;
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Password Validation ─────────────────────────────────────────────────────

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'At least 8 characters required';
  if (!/[A-Z]/.test(password)) return 'At least one uppercase letter required';
  if (!/[0-9]/.test(password)) return 'At least one number required';
  return null;
};

export const getInitials = (username: string): string => {
  const parts = username.split(/[\s._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
};