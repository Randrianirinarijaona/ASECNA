// ─── Auth & Users ───────────────────────────────────────────────────────────

export type Role = 'admin' | 'client';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  avatarInitials?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  confirmPassword: string;
  role: Role;
  adminKey?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Airports ────────────────────────────────────────────────────────────────

export interface AirportDetail {
  icon: string;
  label: string;
  value: string;
}

export interface Flight {
  route: string;
  code: string;
  heure: string;
  duree: string;
}

// export interface Airport {
//   name: string;
//   iata: string;
//   coords: [number, number];
//   markerClass: string;
//   details: AirportDetail[];
//   flights?: Flight[];
// }

export interface Airport {

  name: string;

  iata: string;

  coords: [number, number];

  markerClass: string;

}