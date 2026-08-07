// hooks/useAirportsData.ts
//
// FUSIONNÉ : reprend la version connectée au backend (chargement initial
// via l'API, isLoading/error) et y intègre les nouvelles fonctionnalités
// demandées ensuite : liaisons bidirectionnelles (paramètre `bidirectional`
// transmis à l'API) et points techniques locaux — désormais persistés via
// /local-points/... (localPointService) au lieu d'un état en mémoire.
//
// Les noms de fonctions exposées restent stables pour ne pas impacter les
// composants qui les consomment (MapPage.tsx notamment).
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Airport, Parameter } from '../types';
import type { NetworkCategoryKey, NetworkLink } from '../data/networkCategories';
import {
  airportService,
  networkService,
  linkService,
  localPointService,
} from '../services/network.service';
import { useToast } from './index';

export type AirportsMap = Record<string, Airport>;

interface NetworkItemInput {
  title: string;
  status?: 'operational' | 'maintenance' | 'planned';
  description?: string;
  details?: string[];
}

// Représente un point technique local (module Réseau local, vue carte
// zoomée d'un aéroport). Persisté côté serveur via /local-points/...
export interface LocalTechnicalPoint {
  id: string;
  parentAirportKey: string;
  name: string;
  coords: [number, number];
  localParameters: Parameter[];
}

export function useAirportsData() {
  const { showToast } = useToast();

  const [airports, setAirports] = useState<AirportsMap>({});
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NOUVEAU : points techniques locaux, chargés à la demande par
  // aéroport (évite de tout rapatrier au démarrage) et accumulés dans un
  // tableau à plat, filtré ensuite par `getLocalTechnicalPointsForAirport`.
  const [localTechnicalPoints, setLocalTechnicalPoints] = useState<LocalTechnicalPoint[]>([]);
  const [loadedLocalPointAirports, setLoadedLocalPointAirports] = useState<Set<string>>(new Set());

  // ─── Chargement initial ────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [airportList, linkList] = await Promise.all([airportService.list(), linkService.list()]);
        if (cancelled) return;
        const map: AirportsMap = {};
        airportList.forEach((a) => {
          const { key, ...rest } = a;
          map[key] = rest;
        });
        setAirports(map);
        setLinks(linkList);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          showToast(`Impossible de charger les données réseau : ${(err as Error).message}`, 'error');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleError = useCallback(
    (err: unknown, fallbackMessage: string) => {
      const message = err instanceof Error ? err.message : fallbackMessage;
      showToast(message, 'error');
    },
    [showToast]
  );

  // ─── Aéroports ──────────────────────────────────────────────────────────

  const addAirport = useCallback(
    async (key: string, airport: Airport) => {
      try {
        const created = await airportService.create({
          key,
          name: airport.name,
          iata: airport.iata,
          lat: airport.coords[0],
          lng: airport.coords[1],
        });
        const { key: createdKey, ...rest } = created;
        setAirports((prev) => ({ ...prev, [createdKey]: rest }));
      } catch (err) {
        handleError(err, "Impossible de créer l'aéroport");
      }
    },
    [handleError]
  );

  const deleteAirport = useCallback(
    async (key: string) => {
      try {
        await airportService.remove(key);
        setAirports((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setLinks((prev) => prev.filter((l) => l.fromAirportKey !== key && l.toAirportKey !== key));
        setLocalTechnicalPoints((prev) => prev.filter((p) => p.parentAirportKey !== key));
      } catch (err) {
        handleError(err, "Impossible de supprimer l'aéroport");
      }
    },
    [handleError]
  );

  const addTechnicalPoint = useCallback(
    async (category: NetworkCategoryKey, subItem: string, name: string, coords: [number, number]) => {
      try {
        const created = await airportService.createTechnicalPoint(category, subItem, {
          name,
          lat: coords[0],
          lng: coords[1],
        });
        const { key: createdKey, ...rest } = created;
        setAirports((prev) => ({ ...prev, [createdKey]: rest }));
        return createdKey;
      } catch (err) {
        handleError(err, 'Impossible de créer le point technique');
        return null;
      }
    },
    [handleError]
  );

  // ─── Items réseau (sfa / sma / srna) ─────────────────────────────────────

  const addNetworkItem = useCallback(
    async (airportKey: string, category: NetworkCategoryKey, item: NetworkItemInput) => {
      try {
        const created = await networkService.addItem(airportKey, category, item);
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          const existing = airport.sections[category] || [];
          return {
            ...prev,
            [airportKey]: {
              ...airport,
              sections: {
                ...airport.sections,
                [category]: [
                  ...existing,
                  {
                    id: created.id,
                    title: created.title,
                    description: created.description,
                    details: created.details,
                    status: created.status,
                    subParameters: [],
                  },
                ],
              },
            },
          };
        });
      } catch (err) {
        handleError(err, "Impossible d'ajouter ce paramètre (peut-être déjà existant)");
      }
    },
    [handleError]
  );

  const deleteNetworkItem = useCallback(
    async (airportKey: string, category: NetworkCategoryKey, itemTitle: string) => {
      try {
        await networkService.deleteItem(airportKey, category, itemTitle);
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          const filtered = (airport.sections[category] || []).filter((i) => i.title !== itemTitle);
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
      } catch (err) {
        handleError(err, 'Impossible de supprimer ce paramètre');
      }
    },
    [handleError]
  );

  const findItemId = useCallback(
    (airportKey: string, category: NetworkCategoryKey, itemTitle: string): string | null => {
      const airport = airports[airportKey];
      const item = airport?.sections[category]?.find((i) => i.title === itemTitle);
      return item?.id ?? null;
    },
    [airports]
  );

  const updateNetworkItemStatus = useCallback(
    async (
      airportKey: string,
      category: NetworkCategoryKey,
      itemTitle: string,
      status: 'operational' | 'maintenance'
    ) => {
      const itemId = findItemId(airportKey, category, itemTitle);
      if (!itemId) return;
      try {
        await networkService.updateItem(itemId, { status });
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          const items = airport.sections[category] || [];
          const updated = items.map((i) => (i.title === itemTitle ? { ...i, status } : i));
          return { ...prev, [airportKey]: { ...airport, sections: { ...airport.sections, [category]: updated } } };
        });
      } catch (err) {
        handleError(err, 'Impossible de mettre à jour le statut');
      }
    },
    [findItemId, handleError]
  );

  const updateNetworkItemDescription = useCallback(
    async (airportKey: string, category: NetworkCategoryKey, itemTitle: string, description: string) => {
      const itemId = findItemId(airportKey, category, itemTitle);
      if (!itemId) return;
      try {
        await networkService.updateItem(itemId, { description });
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          const items = airport.sections[category] || [];
          const updated = items.map((i) => (i.title === itemTitle ? { ...i, description } : i));
          return { ...prev, [airportKey]: { ...airport, sections: { ...airport.sections, [category]: updated } } };
        });
      } catch (err) {
        handleError(err, 'Impossible de mettre à jour la description');
      }
    },
    [findItemId, handleError]
  );

  // ─── Sous-paramètres d'un item réseau ───────────────────────────────────

  const addItemSubParameter = useCallback(
    async (airportKey: string, category: NetworkCategoryKey, itemTitle: string, title: string, value: string) => {
      const itemId = findItemId(airportKey, category, itemTitle);
      if (!itemId) return;
      try {
        const created = await networkService.addSubParameter(itemId, title, value);
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          const items = airport.sections[category] || [];
          const updated = items.map((i) =>
            i.title === itemTitle ? { ...i, subParameters: [...(i.subParameters || []), created] } : i
          );
          return { ...prev, [airportKey]: { ...airport, sections: { ...airport.sections, [category]: updated } } };
        });
      } catch (err) {
        handleError(err, "Impossible d'ajouter le sous-paramètre");
      }
    },
    [findItemId, handleError]
  );

  const deleteItemSubParameter = useCallback(
    async (airportKey: string, category: NetworkCategoryKey, itemTitle: string, subId: string) => {
      try {
        await networkService.deleteSubParameter(subId);
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          const items = airport.sections[category] || [];
          const updated = items.map((i) =>
            i.title === itemTitle
              ? { ...i, subParameters: (i.subParameters || []).filter((s) => s.id !== subId) }
              : i
          );
          return { ...prev, [airportKey]: { ...airport, sections: { ...airport.sections, [category]: updated } } };
        });
      } catch (err) {
        handleError(err, 'Impossible de supprimer le sous-paramètre');
      }
    },
    [handleError]
  );

  const toggleItemSubParameterStatus = useCallback(
    async (airportKey: string, category: NetworkCategoryKey, itemTitle: string, subId: string) => {
      try {
        const updatedSub = await networkService.toggleSubParameterStatus(subId);
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          const items = airport.sections[category] || [];
          const updated = items.map((i) =>
            i.title === itemTitle
              ? {
                  ...i,
                  subParameters: (i.subParameters || []).map((s) => (s.id === subId ? updatedSub : s)),
                }
              : i
          );
          return { ...prev, [airportKey]: { ...airport, sections: { ...airport.sections, [category]: updated } } };
        });
      } catch (err) {
        handleError(err, 'Impossible de changer le statut du sous-paramètre');
      }
    },
    [handleError]
  );

  // ─── Liaisons (flèches) ────────────────────────────────────────────────

  const addNetworkLink = useCallback(
    async (
      category: NetworkCategoryKey,
      itemTitle: string,
      fromAirportKey: string,
      toAirportKey: string,
      // NOUVEAU : type de liaison choisi dans LinkManagerModal. Par défaut
      // `false` : le flux "2 clics" sur la carte (NetworkItemModal ->
      // onStartLink -> clic sur un aéroport) ne fournit pas ce paramètre et
      // conserve donc exactement son comportement d'origine.
      bidirectional: boolean = false
    ) => {
      if (fromAirportKey === toAirportKey) return;
      try {
        const created = await linkService.create(category, itemTitle, fromAirportKey, toAirportKey, bidirectional);
        setLinks((prev) => [...prev, created]);
      } catch (err) {
        handleError(err, 'Impossible de créer cette liaison (peut-être déjà existante)');
      }
    },
    [handleError]
  );

  const deleteNetworkLink = useCallback(
    async (linkId: string) => {
      try {
        await linkService.remove(linkId);
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      } catch (err) {
        handleError(err, 'Impossible de supprimer cette liaison');
      }
    },
    [handleError]
  );

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

  const addLinkParameter = useCallback(
    async (linkId: string, name: string) => {
      if (!name.trim()) return;
      try {
        const param = await linkService.addParameter(linkId, name.trim());
        setLinks((prev) =>
          prev.map((l) => (l.id === linkId ? { ...l, parameters: [...(l.parameters || []), param] } : l))
        );
      } catch (err) {
        handleError(err, "Impossible d'ajouter le paramètre");
      }
    },
    [handleError]
  );

  const deleteLinkParameter = useCallback(
    async (linkId: string, paramId: string) => {
      try {
        await linkService.deleteParameter(paramId);
        setLinks((prev) =>
          prev.map((l) =>
            l.id === linkId ? { ...l, parameters: (l.parameters || []).filter((p) => p.id !== paramId) } : l
          )
        );
      } catch (err) {
        handleError(err, 'Impossible de supprimer le paramètre');
      }
    },
    [handleError]
  );

  const addLinkParameterValue = useCallback(
    async (linkId: string, paramId: string, name: string, text: string) => {
      if (!name.trim() || !text.trim()) return;
      try {
        const value = await linkService.addParameterValue(paramId, name.trim(), text.trim());
        setLinks((prev) =>
          prev.map((l) => {
            if (l.id !== linkId) return l;
            return {
              ...l,
              parameters: (l.parameters || []).map((p) =>
                p.id === paramId ? { ...p, values: [...p.values, value] } : p
              ),
            };
          })
        );
      } catch (err) {
        handleError(err, "Impossible d'ajouter la valeur");
      }
    },
    [handleError]
  );

  const deleteLinkParameterValue = useCallback(
    async (linkId: string, paramId: string, valueId: string) => {
      try {
        await linkService.deleteParameterValue(valueId);
        setLinks((prev) =>
          prev.map((l) => {
            if (l.id !== linkId) return l;
            return {
              ...l,
              parameters: (l.parameters || []).map((p) =>
                p.id === paramId ? { ...p, values: p.values.filter((v) => v.id !== valueId) } : p
              ),
            };
          })
        );
      } catch (err) {
        handleError(err, 'Impossible de supprimer la valeur');
      }
    },
    [handleError]
  );

  // ─── Réseau local : liste d'aéroports suivis ────────────────────────────
  // Dérivée du champ `inLocalNetwork` (persistant côté serveur). Le seed
  // backend place désormais les 4 aéroports initiaux (Ivato/Toamasina/
  // Mahajanga/Fort Dauphin) avec `in_local_network = true`.

  const localNetworkAirportKeys = useMemo(
    () => Object.entries(airports).filter(([, a]) => a.inLocalNetwork).map(([key]) => key),
    [airports]
  );

  const addAirportToLocalNetwork = useCallback(
    async (airportKey: string) => {
      try {
        await airportService.addToLocalNetwork(airportKey);
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          return { ...prev, [airportKey]: { ...airport, inLocalNetwork: true } };
        });
      } catch (err) {
        handleError(err, "Impossible d'ajouter cet aéroport au réseau local");
      }
    },
    [handleError]
  );

  const removeAirportFromLocalNetwork = useCallback(
    async (airportKey: string) => {
      try {
        await airportService.removeFromLocalNetwork(airportKey);
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          return { ...prev, [airportKey]: { ...airport, inLocalNetwork: false } };
        });
      } catch (err) {
        handleError(err, 'Impossible de retirer cet aéroport du réseau local');
      }
    },
    [handleError]
  );

  // ─── Informations locales d'un aéroport ─────────────────────────────────

  const addAirportLocalParameter = useCallback(
    async (airportKey: string, name: string) => {
      if (!name.trim()) return;
      try {
        const param = await airportService.addLocalParameter(airportKey, name.trim());
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          return { ...prev, [airportKey]: { ...airport, localParameters: [...(airport.localParameters || []), param] } };
        });
      } catch (err) {
        handleError(err, "Impossible d'ajouter le paramètre local");
      }
    },
    [handleError]
  );

  const deleteAirportLocalParameter = useCallback(
    async (airportKey: string, paramId: string) => {
      try {
        await airportService.deleteLocalParameter(paramId);
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          return {
            ...prev,
            [airportKey]: {
              ...airport,
              localParameters: (airport.localParameters || []).filter((p) => p.id !== paramId),
            },
          };
        });
      } catch (err) {
        handleError(err, 'Impossible de supprimer le paramètre local');
      }
    },
    [handleError]
  );

  const addAirportLocalParameterValue = useCallback(
    async (airportKey: string, paramId: string, name: string, text: string) => {
      if (!name.trim() || !text.trim()) return;
      try {
        const value = await airportService.addLocalParameterValue(paramId, name.trim(), text.trim());
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          return {
            ...prev,
            [airportKey]: {
              ...airport,
              localParameters: (airport.localParameters || []).map((p) =>
                p.id === paramId ? { ...p, values: [...p.values, value] } : p
              ),
            },
          };
        });
      } catch (err) {
        handleError(err, "Impossible d'ajouter la valeur locale");
      }
    },
    [handleError]
  );

  const deleteAirportLocalParameterValue = useCallback(
    async (airportKey: string, paramId: string, valueId: string) => {
      try {
        await airportService.deleteLocalParameterValue(valueId);
        setAirports((prev) => {
          const airport = prev[airportKey];
          if (!airport) return prev;
          return {
            ...prev,
            [airportKey]: {
              ...airport,
              localParameters: (airport.localParameters || []).map((p) =>
                p.id === paramId ? { ...p, values: p.values.filter((v) => v.id !== valueId) } : p
              ),
            },
          };
        });
      } catch (err) {
        handleError(err, 'Impossible de supprimer la valeur locale');
      }
    },
    [handleError]
  );

  // ─── NOUVEAU : points techniques locaux (vue carte zoomée) ──────────────
  // Persistés via /local-points/... (localPointService) au lieu d'un état
  // purement en mémoire.

  const ensureLocalTechnicalPointsLoaded = useCallback(
    async (airportKey: string) => {
      if (loadedLocalPointAirports.has(airportKey)) return;
      try {
        const points = await localPointService.list(airportKey);
        setLocalTechnicalPoints((prev) => {
          const withoutAirport = prev.filter((p) => p.parentAirportKey !== airportKey);
          return [...withoutAirport, ...points];
        });
        setLoadedLocalPointAirports((prev) => new Set(prev).add(airportKey));
      } catch (err) {
        handleError(err, 'Impossible de charger les points techniques de cet aéroport');
      }
    },
    [loadedLocalPointAirports, handleError]
  );

  const addLocalTechnicalPoint = useCallback(
    async (parentAirportKey: string, name: string, coords: [number, number]) => {
      try {
        const created = await localPointService.create(parentAirportKey, {
          name,
          lat: coords[0],
          lng: coords[1],
        });
        setLocalTechnicalPoints((prev) => [...prev, created]);
        return created.id;
      } catch (err) {
        handleError(err, "Impossible de créer le point technique");
        return null;
      }
    },
    [handleError]
  );

  const deleteLocalTechnicalPoint = useCallback(
    async (pointId: string) => {
      try {
        await localPointService.remove(pointId);
        setLocalTechnicalPoints((prev) => prev.filter((p) => p.id !== pointId));
      } catch (err) {
        handleError(err, 'Impossible de supprimer le point technique');
      }
    },
    [handleError]
  );

  const getLocalTechnicalPointsForAirport = useCallback(
    (airportKey: string) => localTechnicalPoints.filter((p) => p.parentAirportKey === airportKey),
    [localTechnicalPoints]
  );

  const addLocalTechnicalPointParameter = useCallback(
    async (pointId: string, name: string) => {
      if (!name.trim()) return;
      try {
        const param = await localPointService.addParameter(pointId, name.trim());
        setLocalTechnicalPoints((prev) =>
          prev.map((p) => (p.id === pointId ? { ...p, localParameters: [...p.localParameters, param] } : p))
        );
      } catch (err) {
        handleError(err, "Impossible d'ajouter le paramètre");
      }
    },
    [handleError]
  );

  const deleteLocalTechnicalPointParameter = useCallback(
    async (pointId: string, paramId: string) => {
      try {
        await localPointService.deleteParameter(paramId);
        setLocalTechnicalPoints((prev) =>
          prev.map((p) =>
            p.id === pointId
              ? { ...p, localParameters: p.localParameters.filter((param) => param.id !== paramId) }
              : p
          )
        );
      } catch (err) {
        handleError(err, 'Impossible de supprimer le paramètre');
      }
    },
    [handleError]
  );

  const addLocalTechnicalPointParameterValue = useCallback(
    async (pointId: string, paramId: string, name: string, text: string) => {
      if (!name.trim() || !text.trim()) return;
      try {
        const value = await localPointService.addParameterValue(paramId, name.trim(), text.trim());
        setLocalTechnicalPoints((prev) =>
          prev.map((p) => {
            if (p.id !== pointId) return p;
            return {
              ...p,
              localParameters: p.localParameters.map((param) =>
                param.id === paramId ? { ...param, values: [...param.values, value] } : param
              ),
            };
          })
        );
      } catch (err) {
        handleError(err, "Impossible d'ajouter la valeur");
      }
    },
    [handleError]
  );

  const deleteLocalTechnicalPointParameterValue = useCallback(
    async (pointId: string, paramId: string, valueId: string) => {
      try {
        await localPointService.deleteParameterValue(valueId);
        setLocalTechnicalPoints((prev) =>
          prev.map((p) => {
            if (p.id !== pointId) return p;
            return {
              ...p,
              localParameters: p.localParameters.map((param) =>
                param.id === paramId
                  ? { ...param, values: param.values.filter((v) => v.id !== valueId) }
                  : param
              ),
            };
          })
        );
      } catch (err) {
        handleError(err, 'Impossible de supprimer la valeur');
      }
    },
    [handleError]
  );

  return {
    airports,
    links,
    isLoading,
    error,
    addAirport,
    addTechnicalPoint,
    deleteAirport,
    addNetworkItem,
    deleteNetworkItem,
    updateNetworkItemStatus,
    updateNetworkItemDescription,
    addNetworkLink,
    deleteNetworkLink,
    getLinksForAirport,
    addLinkParameter,
    deleteLinkParameter,
    addLinkParameterValue,
    deleteLinkParameterValue,
    addItemSubParameter,
    deleteItemSubParameter,
    toggleItemSubParameterStatus,
    localNetworkAirportKeys,
    addAirportToLocalNetwork,
    removeAirportFromLocalNetwork,
    addAirportLocalParameter,
    deleteAirportLocalParameter,
    addAirportLocalParameterValue,
    deleteAirportLocalParameterValue,
    // Points techniques locaux (NOUVEAU)
    localTechnicalPoints,
    ensureLocalTechnicalPointsLoaded,
    addLocalTechnicalPoint,
    deleteLocalTechnicalPoint,
    getLocalTechnicalPointsForAirport,
    addLocalTechnicalPointParameter,
    deleteLocalTechnicalPointParameter,
    addLocalTechnicalPointParameterValue,
    deleteLocalTechnicalPointParameterValue,
  };
}