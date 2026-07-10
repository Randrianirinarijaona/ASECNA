//networkCategories.ts
import type { Airport } from '../types';

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

// ── Paramètres de liaison (nouveau) ─────────────────────────────────────
// Une liaison peut désormais porter ses propres paramètres nommés,
// chacun contenant une ou plusieurs valeurs elles aussi nommées librement
// par l'admin (ex: paramètre "Réseau IP" → valeurs "@IP : 10.2.0.0", "Netmask : ...")

export interface LinkParameterValue {
  id: string;
  text: string; // ex: "@IP : 10.2.0.0"
}

export interface LinkParameter {
  id: string;
  name: string; // ex: "Réseau IP"
  values: LinkParameterValue[];
}

export interface NetworkLink {
  id: string;
  category: NetworkCategoryKey;
  itemTitle: string;       // le paramètre concerné (ex: "AMHS/RSFTA")
  fromAirportKey: string;
  toAirportKey: string;
  parameters?: LinkParameter[]; // nouveau — paramètres propres à cette liaison
}

// Sous-réseaux "officiels" par catégorie, tels que demandés dans le cahier des charges.
// ⚠️ Adapte cette liste si ta nomenclature ASECNA diffère.
export const NETWORK_SUBITEMS: Record<NetworkCategoryKey, string[]> = {
  sfa: ['AMHS', 'SMT', 'AIDC', 'ATS-DS'],
  sma: ['VHF', 'HF'],
  srna: ['Réseau', 'Antenne'],
};

export interface AirportNetworkMatch {
  key: string;
  airport: Airport;
  matchedTitle: string;
  status?: 'operational' | 'maintenance';
}

/**
 * Retourne tous les aéroports qui possèdent un paramètre réseau correspondant
 * à `subItem` dans la catégorie `category`.
 *
 * On compare avec "includes" (insensible à la casse) car les titres réels
 * dans les données (ex: "AMHS/RSFTA") peuvent être plus précis que le libellé
 * générique du sous-réseau (ex: "AMHS").
 *
 * `airportsData` est passé en paramètre plutôt qu'importé directement, pour
 * que la fonction fonctionne aussi bien avec les données mock statiques
 * qu'avec l'état "live" géré par useAirportsData (CRUD admin).
 */
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