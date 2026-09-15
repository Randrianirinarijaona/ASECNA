//networkCategories.ts
import type { Airport, Parameter, ParameterValue } from '../types';

export type NetworkCategoryKey = 'sfa' | 'sma' | 'srna';

export interface NetworkItem {
  title: string;
  description?: string;
  details?: string[];
  status?: 'operational' | 'maintenance';
}

export const NETWORK_CATEGORY_LABELS: Record<NetworkCategoryKey, string> = {
  sfa: 'SFA',
  sma: 'SMA',
  srna: 'SRNA',
};

export const NETWORK_CATEGORY_COLORS: Record<NetworkCategoryKey, string> = {
  sfa: '#2563eb',
  sma: '#16a34a',
  srna: '#7c3aed',
};

export const SFA_ITEM_COLORS: Record<string, string> = {
  amhs: '#2563eb',
  smt: '#16a34a',
  aidc: '#eab308',
  'ats-ds': '#dc2626',
};

export function getNetworkLinkColor(category: NetworkCategoryKey, itemTitle: string): string {
  if (category === 'sfa') {
    const normalized = itemTitle.toLowerCase();
    const matchKey = Object.keys(SFA_ITEM_COLORS).find((key) => normalized.includes(key));
    if (matchKey) return SFA_ITEM_COLORS[matchKey];
  }
  return NETWORK_CATEGORY_COLORS[category];
}

// NOUVEAU : clé de l'aéroport imposé comme point de départ unique de toute
// liaison (Ivato / Antananarivo). Centralisé ici pour être réutilisé par
// LinkManagerModal, NetworkItemModal (bouton "Créer une liaison") et
// useAirportsData (garde-fou de création).
export const ANTANANARIVO_AIRPORT_KEY = 'TNR';

// NOUVEAU : direction d'une liaison relative à Antananarivo (le point de
// départ). Remplace l'ancien booléen `bidirectional`.
export type LinkDirection = 'entrant' | 'sortant' | 'entrant_sortant';

export const LINK_DIRECTION_LABELS: Record<LinkDirection, string> = {
  sortant: 'Sortant',
  entrant: 'Entrant',
  entrant_sortant: 'Entrant et sortant',
};

export const LINK_DIRECTION_GLYPH: Record<LinkDirection, string> = {
  sortant: '→',
  entrant: '←',
  entrant_sortant: '⇄',
};

// NOUVEAU : état opérationnel d'une liaison, modifiable par un administrateur
// (LinkDetailModal). Distinct du statut d'un item réseau (sfa/sma/srna).
export type LinkStatus = 'operational' | 'maintenance' | 'out_of_service';

export const LINK_STATUS_LABELS: Record<LinkStatus, string> = {
  operational: 'Opérationnel',
  maintenance: 'En maintenance',
  out_of_service: 'Hors service',
};

export const LINK_STATUS_COLORS: Record<LinkStatus, string> = {
  operational: '#16a34a',
  maintenance: '#f59e0b',
  out_of_service: '#94a3b8',
};

// ── Paramètres de liaison ─────────────────────────────────────────────────
export type LinkParameterValue = ParameterValue;
export type LinkParameter = Parameter;

export interface NetworkLink {
  id: string;
  category: NetworkCategoryKey;
  itemTitle: string;
  fromAirportKey: string; // toujours ANTANANARIVO_AIRPORT_KEY
  toAirportKey: string;
  parameters?: LinkParameter[];
  // MODIFIÉ : remplace `bidirectional?: boolean` par une direction à 3 états.
  direction: LinkDirection;
  // NOUVEAU : propriétés saisies à la création (LinkManagerModal).
  linkType?: string;
  circuit?: string;
  ipAddress: string;
  port: string;
  // NOUVEAU : état modifiable par un administrateur (LinkDetailModal).
  status: LinkStatus;
}

export const NETWORK_SUBITEMS: Record<NetworkCategoryKey, string[]> = {
  sfa: ['AMHS', 'SMT', 'AIDC', 'ATS-DS'],
  sma: ['VHF', 'HF'],
  srna: ['Réseau', 'Antenne'],
};

export interface AirportNetworkMatch {
  key: string;
  airport: Airport;
  matchedTitle: string;
  status?: 'operational' | 'maintenance' | 'planned';
}

export function getAirportsByNetwork(
  airportsData: Record<string, Airport>,
  category: NetworkCategoryKey,
  subItem: string
): AirportNetworkMatch[] {
  const results: AirportNetworkMatch[] = [];

  Object.entries(airportsData).forEach(([key, airport]) => {
    const items = airport.sections[category] || [];
    const match = items.find((item) =>
      item.title.toLowerCase().includes(subItem.toLowerCase())
    );
    if (match) {
      results.push({ key, airport, matchedTitle: match.title, status: match.status });
    }
  });

  return results;
}