// MapPage.tsx
import { useState, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
// @ts-ignore
import 'leaflet/dist/leaflet.css';

import MapHeader from '../../components/map/MapHeader';
import MainSidebar from '../../components/map/MainSidebar';
import type { MapModule } from '../../components/map/MainSidebar';

import NetworkModal from '../../components/map/NetworkModal';
import NetworkItemModal from '../../components/map/NetworkItemModal';
import NetworkArrow from '../../components/map/NetworkArrow';
import AddAirportModal from '../../components/map/AddAirportModal';
import AirportMarker from '../../components/map/AirportMarker';
import LinkManagerModal from '../../components/map/LinkManagerModal'; // nouveau
import NetworkNodeModal from '../../components/map/NetworkNodeModal'; // nouveau

import { useAirportsData } from '../../hooks/useAirportsData';
import type { NetworkCategoryKey } from '../../data/networkCategories';

import { useAuth, useToast } from '../../hooks'; // ajout de useToast
// @ts-ignore
import './MapPage.css';

export default function MapPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';
  // Le rôle 'user' est strictement limité à la visualisation des sous-réseaux
  // via la sidebar : accès interdit aux paramètres réseau (NetworkModal / NetworkItemModal)
  const canAccessNetworkSettings = user?.role !== 'user';

  const {
    airports,
    links,
    addAirport,
    addTechnicalPoint, // nouveau
    deleteAirport,
    addNetworkItem,
    deleteNetworkItem,
    addNetworkLink,
    deleteNetworkLink,
  } = useAirportsData();

  const [activeModule, setActiveModule] = useState<MapModule>(null);
  const [selectedAirportKey, setSelectedAirportKey] = useState<string | null>(null);

  const [networkUsage, setNetworkUsage] = useState<{
    category: NetworkCategoryKey;
    subItem: string;
  } | null>(null);

  const [selectedNetworkItem, setSelectedNetworkItem] = useState<{
    category: NetworkCategoryKey;
    title: string;
    airportKeys: string[];
  } | null>(null);

  const [showAddAirport, setShowAddAirport] = useState(false);

  const [linkingState, setLinkingState] = useState<{
    category: NetworkCategoryKey;
    itemTitle: string;
    fromAirportKey: string;
  } | null>(null);

  // ── Nouveaux états pour les modals ouverts depuis la sidebar ───────────
  const [linkManager, setLinkManager] = useState<{
    category: NetworkCategoryKey;
    subItem: string;
    mode: 'add' | 'remove';
  } | null>(null);

  const [nodeManager, setNodeManager] = useState<{
    category?: NetworkCategoryKey;
    subItem?: string;
    mode: 'add' | 'remove';
  } | null>(null);

  const centerMadagascar: [number, number] = [-18.9, 46.8];

  // Sous-ensemble de `airports` ne contenant que les points techniques,
  // utilisé par la sidebar (module "Réseau local") et par NetworkNodeModal
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

    if (!canAccessNetworkSettings) {
      showToast('Accès réservé : votre compte est en lecture seule.', 'warning');
      return;
    }

    setSelectedAirportKey(key);
    setNetworkUsage(null);
    setSelectedNetworkItem(null);
  };


  const handleStartLink = (category: NetworkCategoryKey, itemTitle: string) => {
    if (!selectedAirportKey) return;
    setLinkingState({ category, itemTitle, fromAirportKey: selectedAirportKey });
    setSelectedAirportKey(null);
  };

  const handleNetworkSubItemClick = (category: NetworkCategoryKey, subItem: string) => {
    setSelectedAirportKey(null);
    setSelectedNetworkItem(null);
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
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [links, networkUsage, airports]);

  const handleConnectionClick = (category: NetworkCategoryKey, itemTitle: string) => {
    if (!canAccessNetworkSettings) {
      showToast('Accès réservé : votre compte est en lecture seule.', 'warning');
      return;
    }
    const relevant = links.filter((l) => l.category === category && l.itemTitle === itemTitle);
    const airportKeys = Array.from(
      new Set(relevant.flatMap((l) => [l.fromAirportKey, l.toAirportKey]))
    );
    setSelectedNetworkItem({ category, title: itemTitle, airportKeys });
  };

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
            setSelectedNetworkItem(null);
            setLinkManager(null);
            setNodeManager(null);
          }}
          onNetworkSubItemClick={handleNetworkSubItemClick}
          activeNetworkUsage={networkUsage}
          isAdmin={isAdmin}
          onAddAirportClick={() => setShowAddAirport(true)}
          technicalPoints={technicalPoints}
          onAddTechnicalPointClick={() => setNodeManager({ mode: 'add' })}
          onDeleteTechnicalPoint={(key) => deleteAirport(key)}
          onAddLinkClick={(category, subItem) => setLinkManager({ category, subItem, mode: 'add' })}
          onRemoveLinkClick={(category, subItem) => setLinkManager({ category, subItem, mode: 'remove' })}
          onAddNetworkNodeClick={(category, subItem) => setNodeManager({ category, subItem, mode: 'add' })}
          onRemoveNetworkNodeClick={(category, subItem) => setNodeManager({ category, subItem, mode: 'remove' })}
        />

        <div className="map-wrapper">
          {linkingState && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                background: '#1e293b',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
              }}
            >
              <span>
                Cliquez sur l'aéroport à lier pour « {linkingState.itemTitle} »
              </span>
              <button
                onClick={() => setLinkingState(null)}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid #fff',
                  borderRadius: 4,
                  padding: '2px 8px',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
            </div>
          )}

          <MapContainer center={centerMadagascar} zoom={7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Module "aeroport" : tous les points (aéroports + points techniques).
                Module "reseauLocal" : uniquement les points techniques. */}
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
                  color="#2563eb"
                  weight={5}
                  onClick={() => handleConnectionClick(conn.category, conn.itemTitle)}
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
              onAddItem={(category, item) => addNetworkItem(selectedAirportKey, category, item)}
              onDeleteItem={(category, title) => deleteNetworkItem(selectedAirportKey, category, title)}
              onStartLink={handleStartLink}
              onDeleteLink={deleteNetworkLink}
              onNavigateToAirport={(key) => setSelectedAirportKey(key)}
            />
          )}

          {selectedNetworkItem && (
            <NetworkItemModal
              itemTitle={selectedNetworkItem.title}
              itemStatus="operational"
              itemDescription={`Réseau ${selectedNetworkItem.category.toUpperCase()} • ${selectedNetworkItem.title}`}
              airportName={`${selectedNetworkItem.airportKeys.length} aéroport(s) connecté(s)`}
              isAdmin={isAdmin}
              onClose={() => setSelectedNetworkItem(null)}
              onUpdateItem={(newTitle, newStatus, newDesc) => {
                console.log('Mise à jour réseau:', { newTitle, newStatus, newDesc });
                setSelectedNetworkItem(null);
              }}
            />
          )}
        </div>
      </div>

      {showAddAirport && (
        <AddAirportModal onClose={() => setShowAddAirport(false)} onSubmit={addAirport} />
      )}

      {/* ── Nouveaux modals, ouverts depuis la Sidebar ─────────────────── */}
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
    </div>
  );
}