import { Search, Filter } from 'lucide-react';
import './MapHeader.css';

export default function MapHeader() {
  return (
    <div className="map-header">
      <div className="map-header-left">
        <h1>Carte des Terminaux ASECNA</h1>
        <p>Madagascar • Temps réel</p>
      </div>

      <div className="map-search">
        <div className="search-wrapper">
          <Search size={18} />
          <input type="text" placeholder="Rechercher un aéroport..." />
        </div>
        <button className="filter-btn">
          <Filter size={18} />
        </button>
      </div>
    </div>
  );
}