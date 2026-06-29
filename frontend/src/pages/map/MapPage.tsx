//MapPage.tsx
import { useState, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
// @ts-ignore: CSS module side-effect import without type declarations
import 'leaflet/dist/leaflet.css';
import MapHeader from '../../components/map/MapHeader';
import MainSidebar from '../../components/map/MainSidebar';
import type { MapModule } from '../../components/map/MainSidebar';
import NetworkModal from '../../components/map/NetworkModal';
import NetworkUsageTab from '../../components/map/NetworkUsageTab';
import AddAirportModal from '../../components/map/AddAirportModal';
import AirportMarker from '../../components/map/AirportMarker';
import { useAirportsData } from '../../hooks/useAirportsData';
import { getAirportsByNetwork } from '../../data/networkCategories';
import type { NetworkCategoryKey } from '../../data/networkCategories';
// ⚠️ Ajuste ce chemin si ton AuthContext/useAuth est ailleurs dans ton projet
import { useAuth } from '../../hooks';
// @ts-ignore: CSS module side-effect import without type declarations
import './MapPage.css';

export default function MapPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { airports, addAirport, deleteAirport, addNetworkItem, deleteNetworkItem } =
    useAirportsData();

  // Module actif du sidebar permanent : 'aeroport' | 'reseaux' | null
  const [activeModule, setActiveModule] = useState<MapModule>(null);

  // Aéroport dont la modale "réseau actif" est ouverte
  const [selectedAirportKey, setSelectedAirportKey] = useState<string | null>(null);

  // Sous-réseau dont l'onglet "aéroports utilisateurs" est ouvert
  const [networkUsage, setNetworkUsage] = useState<{
    category: NetworkCategoryKey;
    subItem: string;
  } | null>(null);

  const [showAddAirport, setShowAddAirport] = useState(false);

  const centerMadagascar: [number, number] = [-18.9, 46.8];

  const handleAirportMarkerClick = (key: string) => {
    setSelectedAirportKey(key);
  };

  const handleNetworkSubItemClick = (category: NetworkCategoryKey, subItem: string) => {
    setSelectedAirportKey(null);
    setNetworkUsage({ category, subItem });
  };

  const usageMatches = useMemo(() => {
    if (!networkUsage) return [];
    return getAirportsByNetwork(airports, networkUsage.category, networkUsage.subItem);
  }, [airports, networkUsage]);

  const handleRemoveAirportFromNetwork = (airportKey: string, matchedTitle: string) => {
    if (!networkUsage) return;
    deleteNetworkItem(airportKey, networkUsage.category, matchedTitle);
  };

  const handleAddAirportToNetwork = (airportKey: string) => {
    if (!networkUsage) return;
    addNetworkItem(airportKey, networkUsage.category, {
      title: networkUsage.subItem,
      status: 'operational',
    });
  };

  const handleSelectAirportFromUsageTab = (key: string) => {
    setNetworkUsage(null);
    setActiveModule('aeroport');
    setSelectedAirportKey(key);
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
          }}
          onNetworkSubItemClick={handleNetworkSubItemClick}
          isAdmin={isAdmin}
          onAddAirportClick={() => setShowAddAirport(true)}
        />

        <div className="map-wrapper">
          <MapContainer center={centerMadagascar} zoom={7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Les points n'apparaissent que lorsque le module Aéroport est actif */}
            {activeModule === 'aeroport' &&
              Object.entries(airports).map(([key, airport]) => (
                <AirportMarker
                  key={key}
                  airport={airport}
                  onClick={() => handleAirportMarkerClick(key)}
                  isSelected={selectedAirportKey === key}
                />
              ))}
          </MapContainer>

          {/* Modale "paramètres du réseau actif", remplace l'ancien Sidebar de détail */}
          {selectedAirportKey && airports[selectedAirportKey] && (
            <NetworkModal
              airportKey={selectedAirportKey}
              airport={airports[selectedAirportKey]}
              isAdmin={isAdmin}
              onClose={() => setSelectedAirportKey(null)}
              onDeleteAirport={(key) => {
                deleteAirport(key);
                setSelectedAirportKey(null);
              }}
              onAddItem={(category, item) => addNetworkItem(selectedAirportKey, category, item)}
              onDeleteItem={(category, title) =>
                deleteNetworkItem(selectedAirportKey, category, title)
              }
            />
          )}

          {/* Onglet "aéroports utilisant ce réseau", ouvert depuis le module Réseaux */}
          {networkUsage && (
            <NetworkUsageTab
              category={networkUsage.category}
              subItem={networkUsage.subItem}
              matches={usageMatches}
              allAirports={airports}
              isAdmin={isAdmin}
              onClose={() => setNetworkUsage(null)}
              onSelectAirport={handleSelectAirportFromUsageTab}
              onRemoveAirport={handleRemoveAirportFromNetwork}
              onAddAirport={handleAddAirportToNetwork}
            />
          )}
        </div>
      </div>

      {showAddAirport && (
        <AddAirportModal onClose={() => setShowAddAirport(false)} onSubmit={addAirport} />
      )}
    </div>
  );
}