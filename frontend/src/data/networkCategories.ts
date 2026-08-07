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

// ── Couleurs par catégorie (fallback pour SMA/SRNA) ──────────────────────
export const NETWORK_CATEGORY_COLORS: Record<NetworkCategoryKey, string> = {
  sfa: '#2563eb',
  sma: '#16a34a',
  srna: '#7c3aed',
};

// ── Couleurs par sous-réseau SFA ──────────────────────────────────────────
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

// ── Paramètres de liaison ─────────────────────────────────────────────────
export type LinkParameterValue = ParameterValue;
export type LinkParameter = Parameter;

export interface NetworkLink {
  id: string;
  category: NetworkCategoryKey;
  itemTitle: string;
  fromAirportKey: string;
  toAirportKey: string;
  parameters?: LinkParameter[];
  // NOUVEAU : type de liaison choisi dans LinkManagerModal. `false`/absent
  // = comportement historique (flèche à sens unique, from -> to).
  // `true` = flèche affichée dans les deux sens (cf. NetworkArrow).
  bidirectional?: boolean;
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