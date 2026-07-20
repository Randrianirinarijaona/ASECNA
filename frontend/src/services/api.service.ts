// api.service.ts
import type { /* tous tes types */ } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token'); // ou ton système de stockage

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers as Record<string, string>,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new Error('Session expirée');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Erreur ${response.status}`);
  }

  return data as T;
}

// ==================== AUTH ====================
export const authService = {
  login: (payload: LoginPayload) => 
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  me: () => request<User>('/api/auth/me'),
};

// ==================== AIRPORTS ====================
export const airportService = {
  getAll: () => request<Record<string, Airport>>('/api/airports'),
  create: (data: any) => request('/api/airports', { method: 'POST', body: JSON.stringify(data) }),
  delete: (iata: string) => request(`/api/airports/${iata}`, { method: 'DELETE' }),
};

// ==================== NETWORK LINKS ====================
export const networkLinkService = {
  create: (data: any) => request('/api/links', { method: 'POST', body: JSON.stringify(data) }),
  getByCategory: (category: string) => 
    request(`/api/links/by-category/${category}`),
  delete: (linkId: string) => 
    request(`/api/links/${linkId}`, { method: 'DELETE' }),
};

// ==================== NETWORK ITEMS ====================
export const networkItemService = {
  // endpoints à créer dans le backend
  addItem: (airportIata: string, category: string, item: any) =>
    request(`/api/network/${airportIata}/${category}/items`, { method: 'POST', body: JSON.stringify(item) }),
  // ... autres méthodes
};