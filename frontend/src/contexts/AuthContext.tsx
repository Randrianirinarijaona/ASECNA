//AuthContext.tsx
//
// MODIFIÉ : remplace le mock (MOCK_USERS, mot de passe unique '123456',
// jeton 'mock-jwt-token-<timestamp>') par un vrai appel à authService,
// qui parle au backend FastAPI (JWT signé, bcrypt). La forme de l'état
// (AuthState), les noms de fonctions exposées (login/register/logout/
// updateUser) et le comportement général sont INCHANGÉS pour ne rien
// casser dans AppLayout.tsx, RouteGuards.tsx, Login.tsx, Profile.tsx, etc.
import React, { createContext, useCallback, useEffect, useReducer } from 'react';
import type { AuthState, LoginPayload, RegisterPayload, User } from '../types';
import {
  getToken,
  getStoredUser,
  isTokenExpired,
  removeToken,
  saveToken,
  saveUser,
} from '../utils/jwt';
import { authService } from '../services/api.service';

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

  // Rehydrate : vérifie le token stocké auprès du backend (GET /auth/me)
  // plutôt que de faire confiance à la copie locale de l'utilisateur, pour
  // détecter un compte désactivé/supprimé entre-temps.
  useEffect(() => {
    const rehydrate = async () => {
      const token = getToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser || isTokenExpired(token)) {
        removeToken();
        dispatch({ type: 'AUTH_FAILURE' });
        return;
      }

      try {
        const freshUser = await authService.me();
        saveUser(freshUser);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: freshUser, token } });
      } catch {
        removeToken();
        dispatch({ type: 'AUTH_FAILURE' });
      }
    };

    rehydrate();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.login(payload);
      saveToken(response.accessToken);
      saveUser(response.user);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.user, token: response.accessToken } });
    } catch (err) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authService.register(payload);
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
