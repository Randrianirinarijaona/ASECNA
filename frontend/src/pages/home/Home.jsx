import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { LogOut, User, Settings, Shield } from 'lucide-react';
import Sidebar from '../../components/sidebar/Sidebar';
import MapHeader from '../../components/map/MapHeader';
import Toast from '../../components/toast/Toast';
import { AIRPORTS } from '../../data/airportsData';
import '../../App.css';

// Création de l'icône personnalisée Leaflet (Forme goutte)
const createMarkerIcon = (cssClass) => {
  return L.divIcon({
    className: '',
    html: `<div class="custom-marker ${cssClass}"><span>✈</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -42],
  });
};

function Home() {
  const [selectedAirportKey, setSelectedAirportKey] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Gestion du Toast
  const showToast = (message) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Fermeture avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openNational = (key) => {
    setSelectedAirportKey(key);
    setIsSidebarOpen(true);
  };

  const openInternational = (key) => {
    const name = AIRPORTS[key].name;
    showToast(`🌍 Section internationale de ${name} — bientôt disponible`);
  };

  return (
    <div className={`app-root ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      
      {/* BARRE DE PROFIL */}
      <div id="profile-bar" className={isProfileOpen ? 'open' : ''}>
        <button 
          id="profile-btn" 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          aria-expanded={isProfileOpen}
        >
          <div className="profile-avatar">JR</div>
          <span className="profile-label">Compte</span>
          <span className="profile-caret">▼</span>
        </button>

        {isProfileOpen && (
          <div id="profile-menu" role="menu">
            <div className="profile-menu-header">
              <div className="profile-menu-name">Jean Rakoto</div>
              <div className="profile-menu-role">Administrateur</div>
            </div>
            <div className="profile-menu-items">
              <button className="profile-menu-item" onClick={() => showToast('👤 Gestion du profil — bientôt disponible')}>
                <User size={16} className="profile-menu-icon" /> Mon profil
              </button>
              <button className="profile-menu-item" onClick={() => showToast('⚙️ Paramètres — bientôt disponible')}>
                <Settings size={16} className="profile-menu-icon" /> Paramètres
              </button>
              <button className="profile-menu-item" onClick={() => showToast('🔒 Sécurité — bientôt disponible')}>
                <Shield size={16} className="profile-menu-icon" /> Sécurité
              </button>
              <div className="profile-menu-divider"></div>
              <button className="profile-menu-item danger" onClick={() => showToast('🚪 Déconnexion en cours…')}>
                <LogOut size={16} className="profile-menu-icon" /> Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        airport={AIRPORTS[selectedAirportKey]} 
        showToast={showToast}
      />

      {/* OVERLAY */}
      {isSidebarOpen && <div id="overlay" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>}

      {/* CONTENEUR DE LA CARTE */}
      <div id="map-container">
        <MapContainer 
          center={[-18.9, 46.8]} 
          zoom={6} 
          zoomControl={false} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>'
          />
          
          {Object.keys(AIRPORTS).map((key) => {
            const airport = AIRPORTS[key];
            return (
              <Marker 
                key={key}
                position={airport.coords} 
                icon={createMarkerIcon(airport.markerClass)}
              >
                <Popup maxWidth={280} closeButton={false}>
                  <div className="popup-inner">
                    <div className="popup-airport-name">{airport.name}</div>
                    <div className="popup-iata">{airport.iata}</div>
                    <div className="popup-buttons">
                      <button className="popup-btn btn-national" onClick={() => openNational(key)}>
                        🗺 National
                      </button>
                      <button className="popup-btn btn-international" onClick={() => openInternational(key)}>
                        🌍 International
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          <ZoomControl position="bottomright" />
        </MapContainer>
      </div>

      <MapHeader />
      <Toast message={toastMessage} />
    </div>
  );
}

export default Home;