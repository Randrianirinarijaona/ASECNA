//type
// ─── Auth & Users ───────────────────────────────────────────────────────────

export type Role = 'admin' | 'technicien' | 'user';

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
  adminKey?: string;       // requis si role === 'admin'
  validationCode?: string; // requis si role === 'technicien'
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

export interface AirportSectionItem {
    title: string;
    description?: string;
    details?: string[];
    status?: 'operational' | 'maintenance' | 'planned';
    // Tu peux ajouter d'autres champs : date, responsable, etc.
}

export interface Airport {
    name: string;
    iata: string;
    coords: [number, number];
    sections: {
        [key: string]: AirportSectionItem[];   // Changement ici
    };

}

export interface Airport {
    name: string;
    iata: string;
    coords: [number, number];
    // Nouveau : distingue un vrai aéroport d'un simple point technique
    // (relais VHF/HF, antenne SRNA...) créé depuis "Réseau local" ou
    // depuis les boutons "Ajouter un réseau" de la sidebar.
    isTechnicalPoint?: boolean;
    sections: {
        [key: string]: AirportSectionItem[];
    };
}