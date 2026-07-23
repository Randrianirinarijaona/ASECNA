//type/index.ts
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

// Sous-paramètre d'un ITEM réseau (ex: une fréquence précise pour "VHF").
// Conserve son propre statut Opérationnel/Maintenance — non concerné par
// la suppression du point 3, qui ne vise que le statut global d'un item.
export interface NetworkSubParameter {
  id: string;
  title: string;
  value: string;
  status: 'operational' | 'maintenance';
  description?: string;
}

export interface AirportSectionItem {
  title: string;
  description?: string;
  details?: string[];
  // Pour la catégorie SFA, ce champ n'est plus utilisé ni affiché : les
  // items SFA (AMHS/SMT/AIDC/ATS-DS) représentent uniquement des liaisons,
  // sans notion de statut global. Reste utilisé pour SMA/SRNA.
  status?: 'operational' | 'maintenance' | 'planned';
  subParameters?: NetworkSubParameter[];
}

// ── Paramètre nommé générique (nom + liste de valeurs nommées) ──────────
// Réutilisé à la fois par les liaisons (NetworkLink.parameters, cf.
// data/networkCategories.ts) et par les informations locales d'un
// aéroport (Airport.localParameters) : même structure, même comportement
// d'édition, pas de notion de statut.
export interface ParameterValue {
  id: string;
  name: string; // ex: "Adresse IP"
  text: string; // ex: "10.2.0.5"
}

export interface Parameter {
  id: string;
  name: string; // ex: "Réseau IP"
  values: ParameterValue[];
}

export interface Airport {
  name: string;
  iata: string;
  coords: [number, number];
  // Distingue un vrai aéroport d'un point technique de réseau
  // (relais VHF/HF, antenne SRNA...) créé depuis les boutons
  // "Ajouter/Supprimer un réseau" de la sidebar (catégories SMA/SRNA).
  isTechnicalPoint?: boolean;
  sections: {
    [key: string]: AirportSectionItem[];
  };
  // Informations locales propres à CET aéroport uniquement : indépendantes
  // des sections réseau (sfa/sma/srna) et des liaisons. Même structure que
  // les paramètres de liaison (nom de paramètre + valeurs nommées).
  localParameters?: Parameter[];
}