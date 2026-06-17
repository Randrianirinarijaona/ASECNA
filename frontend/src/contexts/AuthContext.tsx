import React, { createContext, useCallback, useEffect, useReducer } from 'react';
import type { AuthState, LoginPayload, RegisterPayload, User } from '../types';
import {
  getToken,
  getStoredUser,
  isTokenExpired,
  removeToken,
  saveToken,
  saveUser,
  getInitials,
} from '../utils/jwt';

// ─── Mock Users for Demo ─────────────────────────────────────────────────────

const MOCK_USERS: Record<string, User> = {
  'admin': {
    id: '1',
    username: 'admin',
    email: 'admin@asecna.mg',
    role: 'admin',
    isActive: true,
    createdAt: '2025-01-15T08:00:00Z',
    lastLogin: new Date().toISOString(),
    avatarInitials: 'AD',
  },
  'user': {
    id: '2',
    username: 'user',
    email: 'user@asecna.mg',
    role: 'client',
    isActive: true,
    createdAt: '2025-02-10T10:30:00Z',
    lastLogin: new Date().toISOString(),
    avatarInitials: 'US',
  },
};

// ─── Reducer & Context (inchangé) ───────────────────────────────────────────

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return { ...initialState, isLoading: false };
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Rehydrate
  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (token && user && !isTokenExpired(token)) {
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } else {
      removeToken();
      dispatch({ type: 'AUTH_FAILURE' });
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    dispatch({ type: 'AUTH_START' });

    // Mock login
    const mockUser = MOCK_USERS[payload.username.toLowerCase()];
    
    if (!mockUser || payload.password !== '123456') {
      throw new Error('Identifiants incorrects. Essayez : admin / 123456 ou user / 123456');
    }

    const token = 'mock-jwt-token-' + Date.now();
    
    const userWithInitials = {
      ...mockUser,
      avatarInitials: getInitials(mockUser.username),
    };

    saveToken(token);
    saveUser(userWithInitials);
    
    dispatch({ type: 'AUTH_SUCCESS', payload: { user: userWithInitials, token } });
  }, []);

  const register = useCallback(async () => {
    throw new Error('Inscription désactivée en mode démo');
  }, []);

  const logout = useCallback(() => {
    removeToken();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const updateUser = useCallback((user: User) => {
    saveUser(user);
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}