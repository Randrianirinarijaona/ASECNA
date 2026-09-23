// services/network.service.ts
import { request } from './api.service';
import type { Airport, Parameter, ParameterValue } from '../types';
import type { NetworkCategoryKey, NetworkLink, LinkDirection } from '../data/networkCategories';

// ─── Aéroports ────────────────────────────────────────────────────────────

export interface AirportSummary {
  key: string;
  name: string;
  iata: string;
  coords: [number, number];
  isTechnicalPoint: boolean;
  inLocalNetwork: boolean;
}

export interface AirportApiResult extends Airport {
  key: string;
}

export const airportService = {
  list: (technical?: boolean): Promise<AirportApiResult[]> =>
    request<AirportApiResult[]>(
      `/airports${technical === undefined ? '' : `?technical=${technical}`}`
    ),

  get: (key: string): Promise<AirportApiResult> => request<AirportApiResult>(`/airports/${encodeURIComponent(key)}`),

  create: (payload: { key: string; name: string; iata: string; lat: number; lng: number }): Promise<AirportApiResult> =>
    request<AirportApiResult>('/airports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // NOUVEAU : modification du nom / code IATA d'un aéroport existant
  // (NetworkModal.tsx, admin uniquement — PATCH /airports/{key}).
  update: (key: string, payload: { name?: string; iata?: string }): Promise<AirportApiResult> =>
    request<AirportApiResult>(`/airports/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  remove: (key: string): Promise<{ message: string }> =>
    request(`/airports/${encodeURIComponent(key)}`, { method: 'DELETE' }),

  createTechnicalPoint: (
    category: NetworkCategoryKey,
    subItem: string,
    payload: { name: string; lat: number; lng: number }
  ): Promise<AirportApiResult> =>
    request<AirportApiResult>(
      `/airports/technical-points/${category}/${encodeURIComponent(subItem)}`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  addToLocalNetwork: (key: string): Promise<AirportSummary> =>
    request<AirportSummary>(`/airports/${encodeURIComponent(key)}/local-network`, { method: 'POST' }),

  removeFromLocalNetwork: (key: string): Promise<AirportSummary> =>
    request<AirportSummary>(`/airports/${encodeURIComponent(key)}/local-network`, { method: 'DELETE' }),

  addLocalParameter: (airportKey: string, name: string): Promise<Parameter> =>
    request<Parameter>(`/airports/${encodeURIComponent(airportKey)}/local-parameters`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  deleteLocalParameter: (paramId: string): Promise<{ message: string }> =>
    request(`/airports/local-parameters/${paramId}`, { method: 'DELETE' }),

  addLocalParameterValue: (paramId: string, name: string, text: string): Promise<ParameterValue> =>
    request<ParameterValue>(`/airports/local-parameters/${paramId}/values`, {
      method: 'POST',
      body: JSON.stringify({ name, text }),
    }),

  deleteLocalParameterValue: (valueId: string): Promise<{ message: string }> =>
    request(`/airports/local-parameters/values/${valueId}`, { method: 'DELETE' }),
};

// ─── Items réseau (sfa / sma / srna) ─────────────────────────────────────

export interface NetworkItemApiResult {
  id: string;
  airportKey: string;
  category: NetworkCategoryKey;
  title: string;
  description?: string;
  details?: string[];
  status?: 'operational' | 'maintenance' | 'planned';
  subParameters: {
    id: string;
    title: string;
    value: string;
    status: 'operational' | 'maintenance';
    description?: string;
  }[];
}

export const networkService = {
  addItem: (
    airportKey: string,
    category: NetworkCategoryKey,
    payload: { title: string; status?: 'operational' | 'maintenance' | 'planned'; description?: string; details?: string[] }
  ): Promise<NetworkItemApiResult> =>
    request<NetworkItemApiResult>(`/network/airports/${encodeURIComponent(airportKey)}/${category}/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteItem: (airportKey: string, category: NetworkCategoryKey, title: string): Promise<{ message: string }> =>
    request(
      `/network/airports/${encodeURIComponent(airportKey)}/${category}/items/${encodeURIComponent(title)}`,
      { method: 'DELETE' }
    ),

  updateItem: (
    itemId: string,
    payload: { title?: string; status?: 'operational' | 'maintenance' | 'planned'; description?: string }
  ): Promise<NetworkItemApiResult> =>
    request<NetworkItemApiResult>(`/network/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  addSubParameter: (
    itemId: string,
    title: string,
    value: string
  ): Promise<NetworkItemApiResult['subParameters'][number]> =>
    request(`/network/items/${itemId}/sub-parameters`, {
      method: 'POST',
      body: JSON.stringify({ title, value }),
    }),

  deleteSubParameter: (subId: string): Promise<{ message: string }> =>
    request(`/network/sub-parameters/${subId}`, { method: 'DELETE' }),

  toggleSubParameterStatus: (subId: string): Promise<NetworkItemApiResult['subParameters'][number]> =>
    request(`/network/sub-parameters/${subId}/toggle-status`, { method: 'PATCH' }),

  getUsage: (category: NetworkCategoryKey, subItem: string) =>
    request<
      { key: string; matchedTitle: string; status?: string; airportName: string; airportIata: string }[]
    >(`/network/usage/${category}/${encodeURIComponent(subItem)}`),
};

// ─── Liaisons (NetworkLink) ───────────────────────────────────────────────

export const linkService = {
  list: (): Promise<NetworkLink[]> => request<NetworkLink[]>('/links'),

  create: (
    category: NetworkCategoryKey,
    itemTitle: string,
    fromAirportKey: string,
    toAirportKey: string,
    details: {
      direction: LinkDirection;
      linkType?: string;
      circuit?: string;
      ipAddress: string;
      port: string;
    }
  ): Promise<NetworkLink> =>
    request<NetworkLink>('/links', {
      method: 'POST',
      body: JSON.stringify({
        category,
        itemTitle,
        fromAirportKey,
        toAirportKey,
        direction: details.direction,
        linkType: details.linkType,
        circuit: details.circuit,
        ipAddress: details.ipAddress,
        port: details.port,
      }),
    }),

  updateStatus: (linkId: string, status: string): Promise<NetworkLink> =>
    request<NetworkLink>(`/links/${linkId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  remove: (linkId: string): Promise<{ message: string }> => request(`/links/${linkId}`, { method: 'DELETE' }),

  addParameter: (linkId: string, name: string): Promise<Parameter> =>
    request<Parameter>(`/links/${linkId}/parameters`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  deleteParameter: (paramId: string): Promise<{ message: string }> =>
    request(`/links/parameters/${paramId}`, { method: 'DELETE' }),

  addParameterValue: (paramId: string, name: string, text: string): Promise<ParameterValue> =>
    request<ParameterValue>(`/links/parameters/${paramId}/values`, {
      method: 'POST',
      body: JSON.stringify({ name, text }),
    }),

  deleteParameterValue: (valueId: string): Promise<{ message: string }> =>
    request(`/links/parameters/values/${valueId}`, { method: 'DELETE' }),
};

// ─── Points techniques locaux (module Réseau local) ──────────────────────

export interface LocalTechnicalPointApiResult {
  id: string;
  parentAirportKey: string;
  name: string;
  coords: [number, number];
  localParameters: Parameter[];
}

export const localPointService = {
  list: (airportKey: string): Promise<LocalTechnicalPointApiResult[]> =>
    request<LocalTechnicalPointApiResult[]>(`/local-points/airport/${encodeURIComponent(airportKey)}`),

  create: (
    airportKey: string,
    payload: { name: string; lat: number; lng: number }
  ): Promise<LocalTechnicalPointApiResult> =>
    request<LocalTechnicalPointApiResult>(`/local-points/airport/${encodeURIComponent(airportKey)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  remove: (pointId: string): Promise<{ message: string }> =>
    request(`/local-points/${pointId}`, { method: 'DELETE' }),

  addParameter: (pointId: string, name: string): Promise<Parameter> =>
    request<Parameter>(`/local-points/${pointId}/parameters`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  deleteParameter: (paramId: string): Promise<{ message: string }> =>
    request(`/local-points/parameters/${paramId}`, { method: 'DELETE' }),

  addParameterValue: (paramId: string, name: string, text: string): Promise<ParameterValue> =>
    request<ParameterValue>(`/local-points/parameters/${paramId}/values`, {
      method: 'POST',
      body: JSON.stringify({ name, text }),
    }),

  deleteParameterValue: (valueId: string): Promise<{ message: string }> =>
    request(`/local-points/parameters/values/${valueId}`, { method: 'DELETE' }),
};