import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  AdminStats,
  ActivityLog,
  PaginatedResponse,
} from '../types';
import { getAuthHeaders, removeToken } from '../utils/jwt';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }

  return data as T;
}

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

export const authService = {
  login: (payload: LoginPayload): Promise<AuthResponse> =>
    request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  register: (payload: Omit<RegisterPayload, 'confirmPassword'>): Promise<{ message: string }> =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: (): Promise<User> => request<User>('/me'),

  resetPasswordRequest: (email: string): Promise<{ message: string }> =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  changePassword: (currentPassword: string, newPassword: string): Promise<{ message: string }> =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),
};

// ─── User Endpoints ───────────────────────────────────────────────────────────

export const userService = {
  getAll: (page = 1, pageSize = 10, search = ''): Promise<PaginatedResponse<User>> =>
    request<PaginatedResponse<User>>(
      `/users?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`
    ),

  getById: (id: string): Promise<User> => request<User>(`/users/${id}`),

  update: (id: string, data: Partial<User>): Promise<User> =>
    request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ message: string }> =>
    request(`/users/${id}`, { method: 'DELETE' }),

  toggleActive: (id: string, isActive: boolean): Promise<User> =>
    request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),

  changeRole: (id: string, role: 'admin' | 'client'): Promise<User> =>
    request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
};

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

export const adminService = {
  getStats: (): Promise<AdminStats> => request<AdminStats>('/admin/stats'),

  getLogs: (page = 1, pageSize = 20): Promise<PaginatedResponse<ActivityLog>> =>
    request<PaginatedResponse<ActivityLog>>(
      `/admin/logs?page=${page}&page_size=${pageSize}`
    ),
};