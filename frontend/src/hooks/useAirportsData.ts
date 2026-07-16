//useAirportsData.ts
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

  // nouveau : persiste la description d'un item réseau
  const updateNetworkItemDescription = useCallback(
    (
      airportKey: string,
      category: NetworkCategoryKey,
      itemTitle: string,
      description: string
    ) => {
      setAirports((prev) => {
        const airport = prev[airportKey];
        if (!airport) return prev;
        const items = airport.sections[category] || [];
        const updated = items.map((i) => (i.title === itemTitle ? { ...i, description } : i));
        return {
          ...prev,
          [airportKey]: { ...airport, sections: { ...airport.sections, [category]: updated } },
        };
      });
    },
    []
  );

  // ─── Liaisons (flèches) ────────────────────────────────────────────────

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
          parameters: [],
        };
        return [...prev, newLink];
      });
    },
    []
  );

  const deleteNetworkLink = useCallback((linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  }, []);

  const getLinksForAirport = useCallback(
    (airportKey: string, category?: NetworkCategoryKey) =>
      links.filter(
        (l) =>
          (l.fromAirportKey === airportKey || l.toAirportKey === airportKey) &&
          (!category || l.category === category)
      ),
    [links]
  );

  // ─── Paramètres de liaison ───────────────────────────────────────────────

  const addLinkParameter = useCallback((linkId: string, name: string) => {
    if (!name.trim()) return;
    setLinks((prev) =>
      prev.map((l) =>
        l.id === linkId
          ? {
              ...l,
              parameters: [
                ...(l.parameters || []),
                { id: `param-${Date.now()}`, name: name.trim(), values: [] },
              ],
            }
          : l
      )
    );
  }, []);

  const deleteLinkParameter = useCallback((linkId: string, paramId: string) => {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === linkId
          ? { ...l, parameters: (l.parameters || []).filter((p) => p.id !== paramId) }
          : l
      )
    );
  }, []);

  const addLinkParameterValue = useCallback(
    (linkId: string, paramId: string, name: string, text: string) => {
      if (!name.trim() || !text.trim()) return;
      setLinks((prev) =>
        prev.map((l) => {
          if (l.id !== linkId) return l;
          return {
            ...l,
            parameters: (l.parameters || []).map((p) =>
              p.id === paramId
                ? {
                    ...p,
                    values: [
                      ...p.values,
                      { id: `val-${Date.now()}`, name: name.trim(), text: text.trim() },
                    ],
                  }
                : p
            ),
          };
        })
      );
    },
    []
  );

  const deleteLinkParameterValue = useCallback(
    (linkId: string, paramId: string, valueId: string) => {
      setLinks((prev) =>
        prev.map((l) => {
          if (l.id !== linkId) return l;
          return {
            ...l,
            parameters: (l.parameters || []).map((p) =>
              p.id === paramId
                ? { ...p, values: p.values.filter((v) => v.id !== valueId) }
                : p
            ),
          };
        })
      );
    },
    []
  );

  // ─── Sous-paramètres d'un item réseau (nouveau) ─────────────────────────
  // Réutilise exactement le même pattern CRUD que les paramètres de liaison,
  // mais rattaché à un AirportSectionItem (identifié par airportKey +
  // category + itemTitle) plutôt qu'à un NetworkLink.

  const addItemSubParameter = useCallback(
    (
      airportKey: string,
      category: NetworkCategoryKey,
      itemTitle: string,
      title: string,
      value: string
    ) => {
      if (!title.trim() || !value.trim()) return;
      setAirports((prev) => {
        const airport = prev[airportKey];
        if (!airport) return prev;
        const items = airport.sections[category] || [];
        const updated = items.map((i) =>
          i.title === itemTitle
            ? {
                ...i,
                subParameters: [
                  ...(i.subParameters || []),
                  {
                    id: `sub-${Date.now()}`,
                    title: title.trim(),
                    value: value.trim(),
                    status: 'operational' as const,
                  },
                ],
              }
            : i
        );
        return {
          ...prev,
          [airportKey]: { ...airport, sections: { ...airport.sections, [category]: updated } },
        };
      });
    },
    []
  );

  const deleteItemSubParameter = useCallback(
    (airportKey: string, category: NetworkCategoryKey, itemTitle: string, subId: string) => {
      setAirports((prev) => {
        const airport = prev[airportKey];
        if (!airport) return prev;
        const items = airport.sections[category] || [];
        const updated = items.map((i) =>
          i.title === itemTitle
            ? { ...i, subParameters: (i.subParameters || []).filter((s) => s.id !== subId) }
            : i
        );
        return {
          ...prev,
          [airportKey]: { ...airport, sections: { ...airport.sections, [category]: updated } },
        };
      });
    },
    []
  );

  const toggleItemSubParameterStatus = useCallback(
    (airportKey: string, category: NetworkCategoryKey, itemTitle: string, subId: string) => {
      setAirports((prev) => {
        const airport = prev[airportKey];
        if (!airport) return prev;
        const items = airport.sections[category] || [];
        const updated = items.map((i) =>
          i.title === itemTitle
            ? {
                ...i,
                subParameters: (i.subParameters || []).map((s) =>
                  s.id === subId
                    ? { ...s, status: s.status === 'operational' ? 'maintenance' : 'operational' }
                    : s
                ),
              }
            : i
        );
        return {
          ...prev,
          [airportKey]: { ...airport, sections: { ...airport.sections, [category]: updated } },
        };
      });
    },
    []
  );

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
    addTechnicalPoint,
    deleteAirport,
    addNetworkItem,
    deleteNetworkItem,
    updateNetworkItemStatus,
    updateNetworkItemDescription, // nouveau
    addNetworkLink,
    deleteNetworkLink,
    getLinksForAirport,
    addLinkParameter,
    deleteLinkParameter,
    addLinkParameterValue,
    deleteLinkParameterValue,
    // nouveau : sous-paramètres persistés par item réseau
    addItemSubParameter,
    deleteItemSubParameter,
    toggleItemSubParameterStatus,
  };
}