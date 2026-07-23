import { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
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
import LocalNetworkModal from '../../components/map/LocalNetworkModal';

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
    localNetworkAirportKeys,
    addAirportToLocalNetwork,
    removeAirportFromLocalNetwork,
    addAirportLocalParameter,
    deleteAirportLocalParameter,
    addAirportLocalParameterValue,
    deleteAirportLocalParameterValue,
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

  const [localNetworkAirportKey, setLocalNetworkAirportKey] = useState<string | null>(null);

  const centerMadagascar: [number, number] = [-18.9, 46.8];

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
      setLocalNetworkAirportKey(key);
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

  const localNetworkAirport = useMemo(() => {
    if (!localNetworkAirportKey) return null;
    const airport = airports[localNetworkAirportKey];
    if (!airport) return null;
    return { key: localNetworkAirportKey, airport };
  }, [localNetworkAirportKey, airports]);

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
            setLocalNetworkAirportKey(null);
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
            if (localNetworkAirportKey === key) setLocalNetworkAirportKey(null);
          }}
          onSelectAirportForLocal={(key) => {
            if (!canAccessNetworkSettings) {
              showToast('Accès réservé : votre compte est en lecture seule.', 'warning');
              return;
            }
            setLocalNetworkAirportKey(key);
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

          <MapContainer
            {...({
              center: centerMadagascar,
              zoom: 6,
              minZoom: 3,
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
                noWrap: true,
              } as any)}
            />

            {(activeModule === 'aeroport' || activeModule === 'reseauLocal') &&
              Object.entries(airports)
                .filter(([, a]) => !a.isTechnicalPoint)
                .map(([key, airport]) => (
                  <AirportMarker
                    key={key}
                    airport={airport}
                    onClick={() => handleAirportMarkerClick(key)}
                    isSelected={
                      activeModule === 'reseauLocal'
                        ? localNetworkAirportKey === key
                        : selectedAirportKey === key
                    }
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

      {localNetworkAirport && (
        <LocalNetworkModal
          airport={localNetworkAirport.airport}
          localParameters={localNetworkAirport.airport.localParameters || []}
          isAdmin={isAdmin}
          onClose={() => setLocalNetworkAirportKey(null)}
          onAddParameter={(name) => addAirportLocalParameter(localNetworkAirport.key, name)}
          onDeleteParameter={(paramId) =>
            deleteAirportLocalParameter(localNetworkAirport.key, paramId)
          }
          onAddValue={(paramId, name, text) =>
            addAirportLocalParameterValue(localNetworkAirport.key, paramId, name, text)
          }
          onDeleteValue={(paramId, valueId) =>
            deleteAirportLocalParameterValue(localNetworkAirport.key, paramId, valueId)
          }
        />
      )}
    </div>
  );
}