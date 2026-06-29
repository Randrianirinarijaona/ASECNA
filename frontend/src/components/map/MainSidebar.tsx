import { useState } from 'react';
import { MapPin, Network, Plus, ChevronDown } from 'lucide-react';
import { NETWORK_CATEGORY_LABELS, NETWORK_SUBITEMS } from '../../data/networkCategories';
import type { NetworkCategoryKey } from '../../data/networkCategories';
import './MainSidebar.css';

export type MapModule = 'aeroport' | 'reseaux' | null;

interface MainSidebarProps {
  activeModule: MapModule;
  onModuleChange: (module: MapModule) => void;
  onNetworkSubItemClick: (category: NetworkCategoryKey, subItem: string) => void;
  isAdmin: boolean;
  onAddAirportClick: () => void;
}

export default function MainSidebar({
  activeModule,
  onModuleChange,
  onNetworkSubItemClick,
  isAdmin,
  onAddAirportClick,
}: MainSidebarProps) {
  const [openCategory, setOpenCategory] = useState<NetworkCategoryKey | null>(null);

  const handleModuleClick = (module: MapModule) => {
    onModuleChange(activeModule === module ? null : module);
    setOpenCategory(null);
  };

  return (
    <aside className="main-sidebar">
      <div className="main-sidebar-header">
        <span className="main-sidebar-title">ASECNA</span>
      </div>

      <nav className="main-sidebar-nav">
        <button
          className={`main-sidebar-btn ${activeModule === 'aeroport' ? 'main-sidebar-btn--active' : ''}`}
          onClick={() => handleModuleClick('aeroport')}
        >
          <MapPin size={18} />
          <span>Aéroport</span>
        </button>
        <button
          className={`main-sidebar-btn ${activeModule === 'reseaux' ? 'main-sidebar-btn--active' : ''}`}
          onClick={() => handleModuleClick('reseaux')}
        >
          <Network size={18} />
          <span>Réseaux</span>
        </button>
      </nav>

      {activeModule === 'aeroport' && isAdmin && (
        <button className="main-sidebar-add-btn" onClick={onAddAirportClick}>
          <Plus size={15} /> Ajouter un aéroport
        </button>
      )}

      {activeModule === 'reseaux' && (
        <div className="main-sidebar-section">
          {(Object.keys(NETWORK_SUBITEMS) as NetworkCategoryKey[]).map((category) => (
            <div key={category} className="network-category">
              <button
                className="network-category-btn"
                onClick={() => setOpenCategory(openCategory === category ? null : category)}
              >
                <span>{NETWORK_CATEGORY_LABELS[category]}</span>
                <ChevronDown
                  size={14}
                  className={`chevron ${openCategory === category ? 'chevron--open' : ''}`}
                />
              </button>

              {openCategory === category && (
                <ul className="network-subitem-list">
                  {NETWORK_SUBITEMS[category].map((subItem) => (
                    <li key={subItem}>
                      <button
                        className="network-subitem-btn"
                        onClick={() => onNetworkSubItemClick(category, subItem)}
                      >
                        {subItem}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}