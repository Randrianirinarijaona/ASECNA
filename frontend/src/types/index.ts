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
  // NOTE (backend) : le backend répond en camelCase (cf. schemas/user.py ->
  // CamelModel), donc `accessToken` et non `access_token` comme dans la
  // version précédente de ce fichier. Corrigé ici pour correspondre
  // exactement à la réponse réelle de POST /auth/login.
  accessToken: string;
  tokenType: string;
  user: User;
}

// ─── Pagination générique (adminService.getLogs, userService.getAll) ───────
// Manquait du fichier fourni initialement mais utilisé par api.service.ts.

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Admin (Admin.tsx) ───────────────────────────────────────────────────
// Reconstruit à partir de l'usage de adminService.getStats()/getLogs() dans
// api.service.ts ; la page Admin.tsx elle-même n'avait pas été fournie.

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<Role, number>;
  totalAirports: number;
  totalTechnicalPoints: number;
  totalLinks: number;
  linksByCategory: Record<string, number>;
}

export interface ActivityLog {
  id: number;
  userId?: string;
  username: string;
  action: string;
  details?: string;
  createdAt: string;
}

// ─── Toasts (ToastContext.tsx) ──────────────────────────────────────────
// Manquait du fichier fourni initialement mais importé par ToastContext.tsx
// et ToastStack.tsx.

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

// ─── Thème (ThemeContext.tsx) ────────────────────────────────────────────
// Manquait du fichier fourni initialement mais importé par AppLayout.tsx,
// Settings.tsx et hooks/index.ts (useTheme). Voir contexts/ThemeContext.tsx
// (nouveau fichier créé pour combler ce manque).

export type ThemeMode = 'light' | 'dark' | 'system';

// ─── Airports ────────────────────────────────────────────────────────────

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
  // Ajouté (rétro-compatible, optionnel) : identifiant serveur de l'item,
  // nécessaire pour cibler les endpoints PATCH /network/items/{id} et
  // POST /network/items/{id}/sub-parameters depuis useAirportsData.ts.
  // Absent dans les données strictement locales/mock, toujours présent
  // une fois l'item chargé depuis l'API.
  id?: string;
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
  // Ajouté : reflète l'appartenance à la liste "Réseau local" de la
  // sidebar, stockée côté serveur (Airport.in_local_network). Remplace
  // l'ancien état purement local `localNetworkAirportKeys` géré en mémoire
  // par useAirportsData — désormais dérivé de ce champ (voir hook mis à jour).
  inLocalNetwork?: boolean;
  sections: {
    [key: string]: AirportSectionItem[];
  };
  // Informations locales propres à CET aéroport uniquement : indépendantes
  // des sections réseau (sfa/sma/srna) et des liaisons. Même structure que
  // les paramètres de liaison (nom de paramètre + valeurs nommées).
  localParameters?: Parameter[];
}
