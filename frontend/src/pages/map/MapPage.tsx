import { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
// @ts-ignore
import 'leaflet/dist/leaflet.css';

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
import TechnicalPointDetailModal from '../../components/map/TechnicalPointDetailModal';

import { useAirportsData } from '../../hooks/useAirportsData';
import { NETWORK_CATEGORY_COLORS } from '../../data/networkCategories';
import type { NetworkCategoryKey } from '../../data/networkCategories';

import { useAuth, useToast, useTheme } from '../../hooks';
// @ts-ignore
import './MapPage.css';

// Catégorie technique utilisée par défaut pour tous les points créés depuis
// "Réseau local" (le module ne distingue pas de sous-réseau particulier,
// contrairement aux points créés depuis la section "Réseaux").
const TECHNICAL_POINT_CATEGORY: NetworkCategoryKey = 'srna';
const TECHNICAL_POINT_ITEM_TITLE = 'Point technique';

// Bornes du monde, utilisées pour empêcher Leaflet de répéter les tuiles
// horizontalement quand on dézoome trop (cf. point 6 de la demande).
const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-90, -180],
  [90, 180],
];

// Petit composant utilitaire (aucun rendu visuel) qui écoute les clics sur
// la carte pour placer un nouveau point technique en mode "placement actif".
// Isolé dans son propre composant car useMapEvents doit être appelé à
// l'intérieur du MapContainer.
function TechnicalPointClickCatcher({
  active,
  onPlace,
}: {
  active: boolean;
  onPlace: (coords: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPlace([e.latlng.lat, e.latlng.lng]);
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

  // ── Réseau local : placement d'un nouveau point technique ────────────
  // true pendant la fenêtre "cliquez sur la carte pour placer le point"
  const [placingTechnicalPoint, setPlacingTechnicalPoint] = useState(false);
  // clé du point technique dont l'onglet de configuration est ouvert
  const [technicalPointDetailKey, setTechnicalPointDetailKey] = useState<string | null>(null);

  const centerMadagascar: [number, number] = [-18.9, 46.8];

  const technicalPoints = useMemo(
    () => Object.fromEntries(Object.entries(airports).filter(([, a]) => a.isTechnicalPoint)),
    [airports]
  );

  const handleAirportMarkerClick = (key: string) => {
    if (linkingState) {
      if (key !== linkingState.fromAirportKey) {
        addNetworkLink(linkingState.category, linkingState.itemTitle, linkingState.fromAirportKey, key);
      }
      setLinkingState(null);
      return;
    }

    // Dans le module "Réseau local", cliquer sur un point technique ouvre
    // directement son onglet de configuration dédié plutôt que le
    // NetworkModal générique (SFA/SMA/SRNA) destiné aux vrais aéroports.
    if (activeModule === 'reseauLocal') {
      if (!canAccessNetworkSettings) {
        showToast('Accès réservé : votre compte est en lecture seule.', 'warning');
        return;
      }
      setTechnicalPointDetailKey(key);
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
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [links, networkUsage, airports]);

  // Stabilisée avec useCallback : évite que NetworkArrow recrée sa polyline
  // Leaflet à chaque re-render de MapPage.
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

  // Point technique actuellement ouvert dans TechnicalPointDetailModal.
  const technicalPointDetail = useMemo(() => {
    if (!technicalPointDetailKey) return null;
    const point = airports[technicalPointDetailKey];
    if (!point) return null;
    const items = point.sections[TECHNICAL_POINT_CATEGORY] || [];
    const item = items.find((i) => i.title === TECHNICAL_POINT_ITEM_TITLE) || items[0];
    if (!item) return null;
    return { key: technicalPointDetailKey, point, item };
  }, [technicalPointDetailKey, airports]);

  const handlePlaceTechnicalPoint = useCallback(
    (coords: [number, number]) => {
      const pointNumber = Object.keys(technicalPoints).length + 1;
      const key = addTechnicalPoint(
        TECHNICAL_POINT_CATEGORY,
        TECHNICAL_POINT_ITEM_TITLE,
        `Point technique ${pointNumber}`,
        coords
      );
      setPlacingTechnicalPoint(false);
      // Le nouveau point apparaît immédiatement sur la carte (état `airports`
      // mis à jour par addTechnicalPoint) ; on ouvre aussitôt son onglet de
      // configuration, vide au départ.
      setTechnicalPointDetailKey(key);
    },
    [addTechnicalPoint, technicalPoints]
  );

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
            setPlacingTechnicalPoint(false);
            setTechnicalPointDetailKey(null);
          }}
          onNetworkSubItemClick={handleNetworkSubItemClick}
          activeNetworkUsage={networkUsage}
          isAdmin={isAdmin}
          onAddAirportClick={() => setShowAddAirport(true)}
          technicalPoints={technicalPoints}
          onAddTechnicalPointClick={() => setPlacingTechnicalPoint(true)}
          onDeleteTechnicalPoint={(key) => deleteAirport(key)}
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

          {placingTechnicalPoint && (
            <div className="linking-banner">
              <span>Cliquez sur la carte pour placer le nouveau point technique</span>
              <button className="linking-banner-cancel" onClick={() => setPlacingTechnicalPoint(false)}>
                Annuler
              </button>
            </div>
          )}

          <MapContainer
            {...({
              center: centerMadagascar,
              zoom: 7,
              minZoom: 3,
              // Empêche Leaflet de créer des copies du monde répétées
              // horizontalement lors d'un zoom arrière important.
              worldCopyJump: false,
              maxBounds: WORLD_BOUNDS,
              maxBoundsViscosity: 1.0,
              style: { height: '100%', width: '100%' },
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
                // Empêche la répétition horizontale des tuiles elles-mêmes
                // (indépendamment des bornes de la carte ci-dessus).
                noWrap: true,
              } as any)}
            />

            <TechnicalPointClickCatcher
              active={placingTechnicalPoint}
              onPlace={handlePlaceTechnicalPoint}
            />

            {(activeModule === 'aeroport' || activeModule === 'reseauLocal') &&
              Object.entries(airports)
                .filter(([, a]) => (activeModule === 'reseauLocal' ? a.isTechnicalPoint : true))
                .map(([key, airport]) => (
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
                  color={NETWORK_CATEGORY_COLORS[conn.category]}
                  weight={5}
                  fromName={conn.fromName}
                  toName={conn.toName}
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

      {technicalPointDetail && (
        <TechnicalPointDetailModal
          airportKey={technicalPointDetail.key}
          airport={technicalPointDetail.point}
          category={TECHNICAL_POINT_CATEGORY}
          itemTitle={technicalPointDetail.item.title}
          subParameters={technicalPointDetail.item.subParameters || []}
          isAdmin={isAdmin}
          onClose={() => setTechnicalPointDetailKey(null)}
          onAddSubParameter={(title, value) =>
            addItemSubParameter(
              technicalPointDetail.key,
              TECHNICAL_POINT_CATEGORY,
              technicalPointDetail.item.title,
              title,
              value
            )
          }
          onDeleteSubParameter={(subId) =>
            deleteItemSubParameter(
              technicalPointDetail.key,
              TECHNICAL_POINT_CATEGORY,
              technicalPointDetail.item.title,
              subId
            )
          }
          onToggleSubParameterStatus={(subId) =>
            toggleItemSubParameterStatus(
              technicalPointDetail.key,
              TECHNICAL_POINT_CATEGORY,
              technicalPointDetail.item.title,
              subId
            )
          }
          onDeletePoint={() => {
            deleteAirport(technicalPointDetail.key);
            setTechnicalPointDetailKey(null);
          }}
        />
      )}
    </div>
  );
}