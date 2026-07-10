import { useState } from 'react';
import {
  MapPin,
  Network,
  RadioTower,
  Plus,
  ChevronDown,
  Link2,
  Unlink,
  Trash2,
} from 'lucide-react';

import { NETWORK_CATEGORY_LABELS, NETWORK_SUBITEMS } from '../../data/networkCategories';
import type { NetworkCategoryKey } from '../../data/networkCategories';
import type { Airport } from '../../types';
import type { AirportsMap } from '../../hooks/useAirportsData';

// @ts-ignore: CSS side-effect import handled by build tooling
import './MainSidebar.css';

export type MapModule = 'aeroport' | 'reseaux' | 'reseauLocal' | null;

interface MainSidebarProps {
  activeModule: MapModule;
  onModuleChange: (module: MapModule) => void;
  onNetworkSubItemClick: (category: NetworkCategoryKey, subItem: string) => void;
  activeNetworkUsage: { category: NetworkCategoryKey; subItem: string } | null;
  isAdmin: boolean;
  onAddAirportClick: () => void;
  technicalPoints: AirportsMap;
  onAddTechnicalPointClick: () => void;
  onDeleteTechnicalPoint: (key: string) => void;
  onAddLinkClick: (category: NetworkCategoryKey, subItem: string) => void;
  onRemoveLinkClick: (category: NetworkCategoryKey, subItem: string) => void;
  onAddNetworkNodeClick: (category: NetworkCategoryKey, subItem: string) => void;
  onRemoveNetworkNodeClick: (category: NetworkCategoryKey, subItem: string) => void;
}

export default function MainSidebar({
  activeModule,
  onModuleChange,
  onNetworkSubItemClick,
  activeNetworkUsage,
  isAdmin,
  onAddAirportClick,
  technicalPoints,
  onAddTechnicalPointClick,
  onDeleteTechnicalPoint,
  onAddLinkClick,
  onRemoveLinkClick,
  onAddNetworkNodeClick,
  onRemoveNetworkNodeClick,
}: MainSidebarProps) {
  const [openCategory, setOpenCategory] = useState<NetworkCategoryKey | null>(null);

  const handleModuleClick = (module: MapModule) => {
    onModuleChange(activeModule === module ? null : module);
    setOpenCategory(null);
  };

  return (
    <aside className="main-sidebar">
      <div className="main-sidebar-header">
        <span className="main-sidebar-title">Réseau ASECNA</span>
      </div>

      <nav className="main-sidebar-nav">
        <button
          className={`main-sidebar-btn ${activeModule === 'aeroport' ? 'main-sidebar-btn--active' : ''}`}
          onClick={() => handleModuleClick('aeroport')}
        >
          <MapPin size={18} />
          <span>Aéroport</span>
        </button>

        {activeModule === 'aeroport' && isAdmin && (
          <button className="main-sidebar-add-btn" onClick={onAddAirportClick}>
            <Plus size={15} /> Ajouter un aéroport
          </button>
        )}

        <button
          className={`main-sidebar-btn ${activeModule === 'reseaux' ? 'main-sidebar-btn--active' : ''}`}
          onClick={() => handleModuleClick('reseaux')}
        >
          <Network size={18} />
          <span>Liaison</span>
        </button>

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
                    {NETWORK_SUBITEMS[category].map((subItem) => {
                      const isActive =
                        activeNetworkUsage?.category === category &&
                        activeNetworkUsage?.subItem === subItem;

                      return (
                        <li key={subItem}>
                          <button
                            className={`network-subitem-btn ${isActive ? 'network-subitem-btn--active' : ''}`}
                            onClick={() => onNetworkSubItemClick(category, subItem)}
                          >
                            {subItem}
                          </button>

                          {isActive && isAdmin && (
                            <div className="network-subitem-actions">
                              {category === 'sfa' ? (
                                <>
                                  <button
                                    className="sidebar-action-btn"
                                    onClick={() => onAddLinkClick(category, subItem)}
                                  >
                                    <Link2 size={12} /> Ajouter une liaison
                                  </button>
                                  <button
                                    className="sidebar-action-btn sidebar-action-btn--danger"
                                    onClick={() => onRemoveLinkClick(category, subItem)}
                                  >
                                    <Unlink size={12} /> Supprimer une liaison
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="sidebar-action-btn"
                                    onClick={() => onAddNetworkNodeClick(category, subItem)}
                                  >
                                    <Plus size={12} /> Ajouter un réseau
                                  </button>
                                  <button
                                    className="sidebar-action-btn sidebar-action-btn--danger"
                                    onClick={() => onRemoveNetworkNodeClick(category, subItem)}
                                  >
                                    <Trash2 size={12} /> Supprimer un réseau
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          className={`main-sidebar-btn ${activeModule === 'reseauLocal' ? 'main-sidebar-btn--active' : ''}`}
          onClick={() => handleModuleClick('reseauLocal')}
        >
          <RadioTower size={18} />
          <span>Réseau local</span>
        </button>
      </nav>

      {activeModule === 'reseauLocal' && (
        <div className="main-sidebar-section">
          {isAdmin && (
            <button className="main-sidebar-add-btn" onClick={onAddTechnicalPointClick}>
              <Plus size={15} /> Ajouter un point technique
            </button>
          )}

          <ul className="network-subitem-list">
            {Object.keys(technicalPoints).length === 0 && (
              <li className="network-empty">Aucun point technique</li>
            )}
            {Object.entries(technicalPoints).map(([key, point]: [string, Airport]) => (
              <li key={key} className="network-subitem-row">
                <span>{point.name}</span>
                {isAdmin && (
                  <button
                    className="icon-btn icon-btn--danger icon-btn--sm"
                    title="Supprimer ce point"
                    onClick={() => onDeleteTechnicalPoint(key)}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}