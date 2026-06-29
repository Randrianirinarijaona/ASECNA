import { useState, useCallback } from 'react';
import { AIRPORTS as INITIAL_AIRPORTS } from '../data/airportsData';
import type { Airport } from '../types';
import type { NetworkCategoryKey, NetworkItem } from '../data/networkCategories';

export type AirportsMap = Record<string, Airport>;

/**
 * Gère les aéroports et leurs paramètres réseau en mémoire (mock).
 *
 * ⚠️ Étape "UI only" (cf. décision projet) : aucune requête réseau n'est
 * faite ici, tout vit dans le state React. Quand le backend FastAPI sera
 * branché, il suffira de :
 *  - remplacer le useState initial par un fetch (airportService.getAll()),
 *  - faire appel au service correspondant dans chaque fonction ci-dessous,
 *    puis mettre à jour le state avec la réponse du serveur.
 */
export function useAirportsData() {
  const [airports, setAirports] = useState<AirportsMap>(INITIAL_AIRPORTS);

  const addAirport = useCallback((key: string, airport: Airport) => {
    setAirports((prev) => ({ ...prev, [key]: airport }));
  }, []);

  const deleteAirport = useCallback((key: string) => {
    setAirports((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const addNetworkItem = useCallback(
    (airportKey: string, category: NetworkCategoryKey, item: NetworkItem) => {
      setAirports((prev) => {
        const airport = prev[airportKey];
        if (!airport) return prev;

        const existing = airport.sections[category] || [];
        // Évite les doublons si ce paramètre existe déjà pour cet aéroport
        if (existing.some((i) => i.title.toLowerCase() === item.title.toLowerCase())) {
          return prev;
        }

        return {
          ...prev,
          [airportKey]: {
            ...airport,
            sections: { ...airport.sections, [category]: [...existing, item] },
          },
        };
      });
    },
    []
  );

  const deleteNetworkItem = useCallback(
    (airportKey: string, category: NetworkCategoryKey, itemTitle: string) => {
      setAirports((prev) => {
        const airport = prev[airportKey];
        if (!airport) return prev;

        const filtered = (airport.sections[category] || []).filter(
          (i) => i.title !== itemTitle
        );

        return {
          ...prev,
          [airportKey]: { ...airport, sections: { ...airport.sections, [category]: filtered } },
        };
      });
    },
    []
  );

  const updateNetworkItemStatus = useCallback(
  (
    airportKey: string,
    category: NetworkCategoryKey,
    itemTitle: string,
    status: 'operational' | 'maintenance'
  ) => {
    setAirports((prev) => {
      const airport = prev[airportKey];
      if (!airport) return prev;

      const items = airport.sections[category] || [];
      const updated = items.map((i) =>
        i.title === itemTitle ? { ...i, status } : i
      );

      return {
        ...prev,
        [airportKey]: {
          ...airport,
          sections: { ...airport.sections, [category]: updated },
        },
      };
    });
  },
  []
);


  return { airports, addAirport, deleteAirport, addNetworkItem, deleteNetworkItem, updateNetworkItemStatus };
}