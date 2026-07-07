import { useState, useCallback } from 'react';
import { AIRPORTS as INITIAL_AIRPORTS } from '../data/airportsData';
import type { Airport } from '../types';
import type { NetworkCategoryKey, NetworkItem, NetworkLink } from '../data/networkCategories';

export type AirportsMap = Record<string, Airport>;

export function useAirportsData() {
  const [airports, setAirports] = useState<AirportsMap>(INITIAL_AIRPORTS);
  const [links, setLinks] = useState<NetworkLink[]>([]);

  const addAirport = useCallback((key: string, airport: Airport) => {
    setAirports((prev) => ({ ...prev, [key]: airport }));
  }, []);

  const deleteAirport = useCallback((key: string) => {
    setAirports((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    // On nettoie aussi les liaisons qui pointaient vers cet aéroport supprimé
    setLinks((prev) =>
      prev.filter((l) => l.fromAirportKey !== key && l.toAirportKey !== key)
    );
  }, []);

  const addNetworkItem = useCallback(
    (airportKey: string, category: NetworkCategoryKey, item: NetworkItem) => {
      setAirports((prev) => {
        const airport = prev[airportKey];
        if (!airport) return prev;
        const existing = airport.sections[category] || [];
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
      // Un item supprimé n'a plus de raison d'avoir des liaisons actives
      setLinks((prev) =>
        prev.filter(
          (l) =>
            !(
              l.category === category &&
              l.itemTitle === itemTitle &&
              (l.fromAirportKey === airportKey || l.toAirportKey === airportKey)
            )
        )
      );
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
        const updated = items.map((i) => (i.title === itemTitle ? { ...i, status } : i));
        return {
          ...prev,
          [airportKey]: { ...airport, sections: { ...airport.sections, [category]: updated } },
        };
      });
    },
    []
  );

  // ─── Liaisons (flèches) ────────────────────────────────────────────────

  /**
   * Crée une liaison entre deux aéroports pour un paramètre réseau donné.
   * Ignore silencieusement si : auto-liaison, ou liaison déjà existante
   * (dans un sens ou dans l'autre — une liaison A→B équivaut à B→A).
   */
  const addNetworkLink = useCallback(
    (
      category: NetworkCategoryKey,
      itemTitle: string,
      fromAirportKey: string,
      toAirportKey: string
    ) => {
      if (fromAirportKey === toAirportKey) return;

      setLinks((prev) => {
        const alreadyExists = prev.some(
          (l) =>
            l.category === category &&
            l.itemTitle === itemTitle &&
            ((l.fromAirportKey === fromAirportKey && l.toAirportKey === toAirportKey) ||
              (l.fromAirportKey === toAirportKey && l.toAirportKey === fromAirportKey))
        );
        if (alreadyExists) return prev;

        const newLink: NetworkLink = {
          id: `${category}-${itemTitle}-${fromAirportKey}-${toAirportKey}-${Date.now()}`,
          category,
          itemTitle,
          fromAirportKey,
          toAirportKey,
        };
        return [...prev, newLink];
      });
    },
    []
  );

  const deleteNetworkLink = useCallback((linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  }, []);

  /** Utilitaire : toutes les liaisons touchant un aéroport (option: filtrées par catégorie) */
  const getLinksForAirport = useCallback(
    (airportKey: string, category?: NetworkCategoryKey) =>
      links.filter(
        (l) =>
          (l.fromAirportKey === airportKey || l.toAirportKey === airportKey) &&
          (!category || l.category === category)
      ),
    [links]
  );


  /**
   * Crée un "point technique" : un point sur la carte qui n'est pas un
   * véritable aéroport (relais VHF/HF, antenne...), mais réutilise la même
   * structure Airport (isTechnicalPoint: true, pas de code IATA).
   * On lui attribue directement l'item réseau correspondant au sous-réseau
   * choisi (category + subItem), pour qu'il apparaisse immédiatement dans
   * les liaisons/filtres existants sans logique supplémentaire.
   */
  const addTechnicalPoint = useCallback(
    (category: NetworkCategoryKey, subItem: string, name: string, coords: [number, number]) => {
      const key = `tech-${category}-${subItem}-${Date.now()}`;
      const point: Airport = {
        name,
        iata: '',
        coords,
        isTechnicalPoint: true,
        sections: { [category]: [{ title: subItem, status: 'operational' }] },
      };
      addAirport(key, point);
      return key;
    },
    [addAirport]
  );


  return {
    airports,
    links,
    addAirport,
    addTechnicalPoint, // ← nouveau
    deleteAirport,
    addNetworkItem,
    deleteNetworkItem,
    updateNetworkItemStatus,
    addNetworkLink,
    deleteNetworkLink,
    getLinksForAirport,
  };
}