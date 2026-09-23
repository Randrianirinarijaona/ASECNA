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

export const ANTANANARIVO_AIRPORT_KEY = 'TNR';

// CORRIGÉ : valeurs internes alignées sur le backend (LinkDirectionEnum :
// incoming/outgoing/both), à l'identique du pattern déjà utilisé pour
// LinkStatus (operational/maintenance/out_of_service). Les valeurs
// françaises précédentes ('sortant'/'entrant'/'entrant_sortant') causaient
// un 422 côté API, qui n'accepte que ces 3 valeurs anglaises précises.
export type LinkDirection = 'incoming' | 'outgoing' | 'both';

export const LINK_DIRECTION_LABELS: Record<LinkDirection, string> = {
  outgoing: 'Sortant',
  incoming: 'Entrant',
  both: 'Entrant et sortant',
};

export const LINK_DIRECTION_GLYPH: Record<LinkDirection, string> = {
  outgoing: '→',
  incoming: '←',
  both: '⇄',
};

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

export type LinkParameterValue = ParameterValue;
export type LinkParameter = Parameter;

export interface NetworkLink {
  id: string;
  category: NetworkCategoryKey;
  itemTitle: string;
  fromAirportKey: string;
  toAirportKey: string;
  parameters?: LinkParameter[];
  direction: LinkDirection;
  linkType?: string;
  circuit?: string;
  ipAddress: string;
  port: string;
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