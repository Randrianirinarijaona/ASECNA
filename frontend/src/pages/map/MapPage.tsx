import { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
// @ts-ignore
import 'leaflet/dist/leaflet.css';
import { Plus } from 'lucide-react';

import MapHeader from '../../components/map/MapHeader';
import MainSidebar from '../../components/map/MainSidebar';
import type { MapModule } from '../../components/map/MainSidebar';

import NetworkModal from '../../components/map/NetworkModal';
import NetworkArrow from '../../components/map/NetworkArrow';
import AddAirportModal from '../../components/map/AddAirportModal';
import AirportMarker from '../../components/map/AirportMarker';
import LinkManagerModal from '../../components/map/LinkManagerModal';
import NetworkNodeModal from '../../components/map/NetworkNodeModal';
import LinkDetailModal from '../../components/map/LinkDetailModal';
import LocalNetworkModal from '../../components/map/LocalNetworkModal';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';

import { useAirportsData } from '../../hooks/useAirportsData';
import { getNetworkLinkColor, getAirportsByNetwork } from '../../data/networkCategories';
import type { NetworkCategoryKey } from '../../data/networkCategories';

import { useAuth, useToast, useTheme } from '../../hooks';
// @ts-ignore: CSS side-effect import handled by build toolings
import './MapPage.css';

const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-90, -180],
  [90, 180],
];

const MADAGASCAR_CENTER: [number, number] = [-18.9, 46.8];
const DEFAULT_ZOOM = 6;
const MIN_ZOOM = 3;
const LOCAL_ZOOM = 13;
const LOCAL_MIN_ZOOM = 11;
const LOCAL_BOUNDS_DELTA = 0.15;

// Pilote la vue Leaflet (zoom + bounds) selon l'aéroport actuellement
// affiché en vue "carte zoomée" dans le module Réseau local.
function LocalAirportZoomController({ targetCoords }: { targetCoords: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (targetCoords) {
      const [lat, lng] = targetCoords;
      map.setMinZoom(LOCAL_MIN_ZOOM);
      map.setMaxBounds([
        [lat - LOCAL_BOUNDS_DELTA, lng - LOCAL_BOUNDS_DELTA],
        [lat + LOCAL_BOUNDS_DELTA, lng + LOCAL_BOUNDS_DELTA],
      ]);
      map.flyTo(targetCoords, LOCAL_ZOOM, { duration: 0.75 });
    } else {
      map.setMinZoom(MIN_ZOOM);
      map.setMaxBounds(WORLD_BOUNDS);
      map.flyTo(MADAGASCAR_CENTER, DEFAULT_ZOOM, { duration: 0.75 });
    }
  }, [targetCoords, map]);

  return null;
}

// Capte les clics sur la carte pour placer un point technique local,
// uniquement quand `active` est vrai.
function LocalPointClickCatcher({
  active,
  onPick,
}: {
  active: boolean;
  onPick: (coords: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { resolvedTheme } = useTheme();

  const isAdmin = user?.role === 'admin';
  const canAccessNetworkSettings = user?.role !== 'user';

  const {
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
    // Points techniques locaux
    localTechnicalPoints,
    ensureLocalTechnicalPointsLoaded,
    addLocalTechnicalPoint,
    addLocalTechnicalPointParameter,
    deleteLocalTechnicalPointParameter,
    addLocalTechnicalPointParameterValue,
    deleteLocalTechnicalPointParameterValue,
  } = useAirportsData();

  const [activeModule, setActiveModule] = useState<MapModule>(null);
  const [selectedAirportKey, setSelectedAirportKey] = useState<string | null>(null);
  const [networkUsage, setNetworkUsage] = useState<{
    category: NetworkCategoryKey;
    subItem: string;
  } | null>(null);

  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [showAddAirport, setShowAddAirport] = useState(false);

  const [linkingState, setLinkingState] = useState<{
    category: NetworkCategoryKey;
    itemTitle: string;
    fromAirportKey: string;
  } | null>(null);

  const [linkManager, setLinkManager] = useState<{
    category: NetworkCategoryKey;
    subItem: string;
    mode: 'add' | 'remove';
  } | null>(null);

  const [nodeManager, setNodeManager] = useState<{
    category: NetworkCategoryKey;
    subItem: string;
    mode: 'add' | 'remove';
  } | null>(null);

  // Vue carte zoomée d'un aéroport du module Réseau local.
  const [zoomedLocalAirportKey, setZoomedLocalAirportKey] = useState<string | null>(null);
  const [selectedLocalPointId, setSelectedLocalPointId] = useState<string | null>(null);
  const [addingLocalPointMode, setAddingLocalPointMode] = useState(false);
  const [pendingPointCoords, setPendingPointCoords] = useState<[number, number] | null>(null);
  const [newPointName, setNewPointName] = useState('');

  const technicalPoints = useMemo(
    () => Object.fromEntries(Object.entries(airports).filter(([, a]) => a.isTechnicalPoint)),
    [airports]
  );

  const relevantTechnicalNodes = useMemo(() => {
    if (!networkUsage || networkUsage.category === 'sfa') return {};
    const matches = getAirportsByNetwork(airports, networkUsage.category, networkUsage.subItem);
    return Object.fromEntries(
      matches.filter((m) => m.airport.isTechnicalPoint).map((m) => [m.key, m.airport])
    );
  }, [airports, networkUsage]);

  // NOUVEAU : charge les points techniques locaux depuis l'API dès qu'un
  // aéroport est zoomé (cache géré dans le hook, pas de rechargement
  // inutile si déjà chargé une première fois).
  useEffect(() => {
    if (zoomedLocalAirportKey) {
      ensureLocalTechnicalPointsLoaded(zoomedLocalAirportKey);
    }
  }, [zoomedLocalAirportKey, ensureLocalTechnicalPointsLoaded]);

  const pointsForZoomedAirport = useMemo(
    () =>
      zoomedLocalAirportKey
        ? localTechnicalPoints.filter((p) => p.parentAirportKey === zoomedLocalAirportKey)
        : [],
    [localTechnicalPoints, zoomedLocalAirportKey]
  );

  const selectedLocalPoint = useMemo(
    () => localTechnicalPoints.find((p) => p.id === selectedLocalPointId) || null,
    [localTechnicalPoints, selectedLocalPointId]
  );

  const closePendingPoint = useCallback(() => {
    setPendingPointCoords(null);
    setNewPointName('');
  }, []);

  const handleAirportMarkerClick = (key: string) => {
    if (linkingState) {
      if (key !== linkingState.fromAirportKey) {
        addNetworkLink(linkingState.category, linkingState.itemTitle, linkingState.fromAirportKey, key);
      }
      setLinkingState(null);
      return;
    }

    if (activeModule === 'reseauLocal') {
      if (!canAccessNetworkSettings) {
        showToast('Accès réservé : votre compte est en lecture seule.', 'warning');
        return;
      }
      addAirportToLocalNetwork(key);
      setZoomedLocalAirportKey(key);
      return;
    }

    if (!canAccessNetworkSettings) {
      showToast('Accès réservé : votre compte est en lecture seule.', 'warning');
      return;
    }

    setSelectedAirportKey(key);
    setNetworkUsage(null);
  };

  const handleStartLink = (category: NetworkCategoryKey, itemTitle: string) => {
    if (!selectedAirportKey) return;
    setLinkingState({ category, itemTitle, fromAirportKey: selectedAirportKey });
    setSelectedAirportKey(null);
  };

  const handleNetworkSubItemClick = (category: NetworkCategoryKey, subItem: string) => {
    setSelectedAirportKey(null);
    setNetworkUsage({ category, subItem });
  };

  const networkConnections = useMemo(() => {
    if (!networkUsage) return [];

    return links
      .filter(
        (l) =>
          l.category === networkUsage.category &&
          l.itemTitle.toLowerCase().includes(networkUsage.subItem.toLowerCase())
      )
      .map((l) => {
        const from = airports[l.fromAirportKey];
        const to = airports[l.toAirportKey];
        if (!from?.coords || !to?.coords) return null;
        return {
          id: l.id,
          positions: [from.coords, to.coords] as [number, number][],
          category: l.category,
          itemTitle: l.itemTitle,
          fromName: from.name,
          toName: to.name,
          bidirectional: l.bidirectional,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [links, networkUsage, airports]);

  const openLinkDetail = useCallback(
    (linkId: string) => {
      if (!canAccessNetworkSettings) {
        showToast('Accès réservé : votre compte est en lecture seule.', 'warning');
        return;
      }
      setSelectedLinkId(linkId);
    },
    [canAccessNetworkSettings, showToast]
  );

  const selectedLink = useMemo(() => {
    if (!selectedLinkId) return null;
    const link = links.find((l) => l.id === selectedLinkId);
    if (!link) return null;
    const from = airports[link.fromAirportKey];
    const to = airports[link.toAirportKey];
    if (!from || !to) return null;
    return { link, from, to };
  }, [selectedLinkId, links, airports]);

  if (isLoading) {
    return (
      <div className="map-page map-page--loading">
        <Spinner size="lg" label="Chargement du réseau ASECNA…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-page map-page--loading">
        <p className="form-error">
          Impossible de contacter le serveur ({error}). Vérifiez que le backend FastAPI est démarré.
        </p>
      </div>
    );
  }

  return (
    <div className="map-page">
      <MapHeader />

      <div className="map-container">
        <MainSidebar
          activeModule={activeModule}
          onModuleChange={(module) => {
            setActiveModule(module);
            setSelectedAirportKey(null);
            setNetworkUsage(null);
            setSelectedLinkId(null);
            setLinkManager(null);
            setNodeManager(null);
            setZoomedLocalAirportKey(null);
            setSelectedLocalPointId(null);
            setAddingLocalPointMode(false);
          }}
          onNetworkSubItemClick={handleNetworkSubItemClick}
          activeNetworkUsage={networkUsage}
          isAdmin={isAdmin}
          onAddAirportClick={() => setShowAddAirport(true)}
          airports={airports}
          localNetworkAirportKeys={localNetworkAirportKeys}
          onAddAirportToLocalNetwork={addAirportToLocalNetwork}
          onRemoveAirportFromLocalNetwork={(key) => {
            removeAirportFromLocalNetwork(key);
            if (zoomedLocalAirportKey === key) {
              setZoomedLocalAirportKey(null);
              setSelectedLocalPointId(null);
            }
          }}
          onSelectAirportForLocal={(key) => {
            if (!canAccessNetworkSettings) {
              showToast('Accès réservé : votre compte est en lecture seule.', 'warning');
              return;
            }
            setZoomedLocalAirportKey(key);
          }}
          onAddLinkClick={(category, subItem) => setLinkManager({ category, subItem, mode: 'add' })}
          onRemoveLinkClick={(category, subItem) => setLinkManager({ category, subItem, mode: 'remove' })}
          onAddNetworkNodeClick={(category, subItem) => setNodeManager({ category, subItem, mode: 'add' })}
          onRemoveNetworkNodeClick={(category, subItem) => setNodeManager({ category, subItem, mode: 'remove' })}
        />

        <div className="map-wrapper">
          {linkingState && (
            <div className="linking-banner">
              <span>
                Cliquez sur l'aéroport à lier pour « <strong>{linkingState.itemTitle}</strong> »
              </span>
              <button className="linking-banner-cancel" onClick={() => setLinkingState(null)}>
                Annuler
              </button>
            </div>
          )}

          {zoomedLocalAirportKey && airports[zoomedLocalAirportKey] && (
            <div className="linking-banner">
              <span>
                Vue locale : <strong>{airports[zoomedLocalAirportKey].name}</strong>
                {addingLocalPointMode && ' — Cliquez sur la carte pour placer le point'}
              </span>
              {isAdmin && !addingLocalPointMode && (
                <button className="sidebar-action-btn" onClick={() => setAddingLocalPointMode(true)}>
                  <Plus size={12} /> Ajouter un point technique
                </button>
              )}
              {addingLocalPointMode && (
                <button className="linking-banner-cancel" onClick={() => setAddingLocalPointMode(false)}>
                  Annuler
                </button>
              )}
              <button
                className="linking-banner-cancel"
                onClick={() => {
                  setZoomedLocalAirportKey(null);
                  setSelectedLocalPointId(null);
                  setAddingLocalPointMode(false);
                }}
              >
                Retour à la vue générale
              </button>
            </div>
          )}

          <MapContainer
            {...({
              center: MADAGASCAR_CENTER,
              zoom: DEFAULT_ZOOM,
              minZoom: MIN_ZOOM,
              worldCopyJump: false,
              maxBounds: WORLD_BOUNDS,
              maxBoundsViscosity: 1.0,
              style: { height: '100%', width: '100%', zIndex:"10"},
            } as any)}
          >
            <TileLayer
              {...({
                attribution:
                  resolvedTheme === 'dark'
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                url:
                  resolvedTheme === 'dark'
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                noWrap: true,
              } as any)}
            />

            <LocalAirportZoomController
              targetCoords={
                zoomedLocalAirportKey ? airports[zoomedLocalAirportKey]?.coords ?? null : null
              }
            />

            <LocalPointClickCatcher
              active={addingLocalPointMode}
              onPick={(coords) => {
                setPendingPointCoords(coords);
                setAddingLocalPointMode(false);
              }}
            />

            {(activeModule === 'aeroport' ||
              (activeModule === 'reseauLocal' && !zoomedLocalAirportKey)) &&
              Object.entries(airports)
                .filter(([, a]) => !a.isTechnicalPoint)
                .map(([key, airport]) => (
                  <AirportMarker
                    key={key}
                    airport={airport}
                    onClick={() => handleAirportMarkerClick(key)}
                    isSelected={selectedAirportKey === key}
                  />
                ))}

            {zoomedLocalAirportKey && airports[zoomedLocalAirportKey] && (
              <AirportMarker
                airport={airports[zoomedLocalAirportKey]}
                onClick={() => undefined}
                isSelected
              />
            )}
            {zoomedLocalAirportKey &&
              pointsForZoomedAirport.map((point) => (
                <AirportMarker
                  key={point.id}
                  airport={{
                    name: point.name,
                    iata: '',
                    coords: point.coords,
                    sections: { sfa: [], sma: [], srna: [] },
                  }}
                  onClick={() => setSelectedLocalPointId(point.id)}
                  isSelected={selectedLocalPointId === point.id}
                />
              ))}

            {Object.entries(relevantTechnicalNodes).map(([key, airport]) => (
              <AirportMarker
                key={key}
                airport={airport}
                onClick={() => handleAirportMarkerClick(key)}
                isSelected={selectedAirportKey === key}
              />
            ))}

            {networkUsage &&
              networkConnections.map((conn) => (
                <NetworkArrow
                  key={conn.id}
                  positions={conn.positions}
                  color={getNetworkLinkColor(conn.category, conn.itemTitle)}
                  weight={4}
                  fromName={conn.fromName}
                  toName={conn.toName}
                  bidirectional={conn.bidirectional}
                  onClick={() => openLinkDetail(conn.id)}
                />
              ))}
          </MapContainer>

          {selectedAirportKey && airports[selectedAirportKey] && (
            <NetworkModal
              airportKey={selectedAirportKey}
              airport={airports[selectedAirportKey]}
              isAdmin={isAdmin}
              allAirports={airports}
              links={links}
              onClose={() => setSelectedAirportKey(null)}
              onDeleteAirport={(key) => {
                deleteAirport(key);
                setSelectedAirportKey(null);
              }}
              onAddItem={(category, item) => addNetworkItem(selectedAirportKey, category, item as any)}
              onDeleteItem={(category, title) => deleteNetworkItem(selectedAirportKey, category, title)}
              onUpdateItemStatus={updateNetworkItemStatus}
              onUpdateItemDescription={updateNetworkItemDescription}
              onAddSubParameter={addItemSubParameter}
              onDeleteSubParameter={deleteItemSubParameter}
              onToggleSubParameterStatus={toggleItemSubParameterStatus}
              onStartLink={handleStartLink}
              onDeleteLink={deleteNetworkLink}
              onOpenLinkDetail={openLinkDetail}
            />
          )}
        </div>
      </div>

      {showAddAirport && (
        <AddAirportModal
          existingKeys={Object.keys(airports)}
          onClose={() => setShowAddAirport(false)}
          onSubmit={addAirport}
        />
      )}

      {linkManager && (
        <LinkManagerModal
          category={linkManager.category}
          subItem={linkManager.subItem}
          mode={linkManager.mode}
          airports={airports}
          links={links}
          onAddLink={addNetworkLink}
          onDeleteLink={deleteNetworkLink}
          onClose={() => setLinkManager(null)}
        />
      )}

      {nodeManager && (
        <NetworkNodeModal
          category={nodeManager.category}
          subItem={nodeManager.subItem}
          mode={nodeManager.mode}
          airports={technicalPoints}
          onCreate={(category, subItem, name, coords) => {
            addTechnicalPoint(category, subItem, name, coords);
            setNodeManager(null);
          }}
          onDelete={(key) => deleteAirport(key)}
          onClose={() => setNodeManager(null)}
        />
      )}

      {selectedLink && (
        <LinkDetailModal
          link={selectedLink.link}
          fromAirport={selectedLink.from}
          toAirport={selectedLink.to}
          isAdmin={isAdmin}
          onClose={() => setSelectedLinkId(null)}
          onAddParameter={addLinkParameter}
          onDeleteParameter={deleteLinkParameter}
          onAddValue={addLinkParameterValue}
          onDeleteValue={deleteLinkParameterValue}
        />
      )}

      {selectedLocalPoint && (
        <LocalNetworkModal
          airport={{
            name: selectedLocalPoint.name,
            iata: '',
            coords: selectedLocalPoint.coords,
            sections: { sfa: [], sma: [], srna: [] },
          }}
          localParameters={selectedLocalPoint.localParameters}
          isAdmin={isAdmin}
          onClose={() => setSelectedLocalPointId(null)}
          onAddParameter={(name) => addLocalTechnicalPointParameter(selectedLocalPoint.id, name)}
          onDeleteParameter={(paramId) =>
            deleteLocalTechnicalPointParameter(selectedLocalPoint.id, paramId)
          }
          onAddValue={(paramId, name, text) =>
            addLocalTechnicalPointParameterValue(selectedLocalPoint.id, paramId, name, text)
          }
          onDeleteValue={(paramId, valueId) =>
            deleteLocalTechnicalPointParameterValue(selectedLocalPoint.id, paramId, valueId)
          }
        />
      )}

      <Modal
        isOpen={Boolean(pendingPointCoords)}
        onClose={closePendingPoint}
        title="Nouveau point technique"
        size="sm"
        footer={
          <div className="modal-footer-actions">
            <button className="btn btn-secondary" onClick={closePendingPoint}>
              Annuler
            </button>
            <button
              className="btn btn-primary"
              disabled={!newPointName.trim()}
              onClick={async () => {
                if (zoomedLocalAirportKey && pendingPointCoords) {
                  const newId = await addLocalTechnicalPoint(
                    zoomedLocalAirportKey,
                    newPointName.trim(),
                    pendingPointCoords
                  );
                  if (newId) setSelectedLocalPointId(newId);
                }
                closePendingPoint();
              }}
            >
              Créer
            </button>
          </div>
        }
      >
        <div className="form-group text-left">
          <label className="form-label">Nom du point</label>
          <input
            className="form-input"
            autoFocus
            value={newPointName}
            onChange={(e) => setNewPointName(e.target.value)}
            placeholder="ex: Groupe électrogène nord"
          />
        </div>
      </Modal>
    </div>
  );
}