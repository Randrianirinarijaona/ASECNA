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

  // NOUVEAU : contrôle l'affichage de l'entrée "Réseau local" elle-même.
  // Le rôle 'user' (lecture seule stricte) n'a plus accès à ce module du
  // tout — le bouton et sa section ne sont pas rendus. Les autres modules
  // (Aéroport, Liaison) restent inchangés.
  canAccessLocalNetwork: boolean;

  // Réseau local : tous les vrais aéroports (pour le picker "Ajouter un
  // aéroport"), la liste de ceux déjà suivis, et les actions associées.
  airports: AirportsMap;
  localNetworkAirportKeys: string[];
  onAddAirportToLocalNetwork: (key: string) => void;
  onRemoveAirportFromLocalNetwork: (key: string) => void;
  onSelectAirportForLocal: (key: string) => void;

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
  canAccessLocalNetwork,
  airports,
  localNetworkAirportKeys,
  onAddAirportToLocalNetwork,
  onRemoveAirportFromLocalNetwork,
  onSelectAirportForLocal,
  onAddLinkClick,
  onRemoveLinkClick,
  onAddNetworkNodeClick,
  onRemoveNetworkNodeClick,
}: MainSidebarProps) {
  const [openCategory, setOpenCategory] = useState<NetworkCategoryKey | null>(null);
  const [showLocalAddPicker, setShowLocalAddPicker] = useState(false);

  const handleModuleClick = (module: MapModule) => {
    onModuleChange(activeModule === module ? null : module);
    setOpenCategory(null);
    setShowLocalAddPicker(false);
  };

  // Seuls les vrais aéroports peuvent recevoir des informations locales
  // (les points techniques SMA/SRNA ne sont pas concernés).
  const realAirportEntries = Object.entries(airports).filter(([, a]) => !a.isTechnicalPoint);
  const addedLocalAirports = realAirportEntries.filter(([key]) =>
    localNetworkAirportKeys.includes(key)
  );
  const availableLocalAirports = realAirportEntries.filter(
    ([key]) => !localNetworkAirportKeys.includes(key)
  );

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

        {/* MODIFIÉ : le bouton "Réseau local" (et donc tout le module) n'est
            plus rendu pour le rôle 'user' (lecture seule stricte). */}
        {canAccessLocalNetwork && (
          <button
            className={`main-sidebar-btn ${activeModule === 'reseauLocal' ? 'main-sidebar-btn--active' : ''}`}
            onClick={() => handleModuleClick('reseauLocal')}
          >
            <RadioTower size={18} />
            <span>Réseau local</span>
          </button>
        )}
      </nav>

      {canAccessLocalNetwork && activeModule === 'reseauLocal' && (
        <div className="main-sidebar-section">
          {isAdmin && (
            <button
              className="main-sidebar-add-btn"
              onClick={() => setShowLocalAddPicker((v) => !v)}
            >
              <Plus size={15} /> Ajouter un aéroport
            </button>
          )}

          {showLocalAddPicker && (
            <ul className="network-subitem-list">
              {availableLocalAirports.length === 0 && (
                <li className="network-empty">Tous les aéroports sont déjà ajoutés</li>
              )}
              {availableLocalAirports.map(([key, airport]) => (
                <li key={key}>
                  <button
                    className="network-subitem-btn"
                    onClick={() => {
                      onAddAirportToLocalNetwork(key);
                      setShowLocalAddPicker(false);
                    }}
                  >
                    {airport.iata ? `${airport.iata} — ${airport.name}` : airport.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <ul className="network-subitem-list">
            {addedLocalAirports.length === 0 && (
              <li className="network-empty">Aucun aéroport ajouté au réseau local</li>
            )}
            {addedLocalAirports.map(([key, airport]) => (
              <li key={key} className="network-subitem-row">
                <button
                  className="network-subitem-btn"
                  style={{ flex: 1, textAlign: 'left' }}
                  onClick={() => onSelectAirportForLocal(key)}
                >
                  {airport.iata ? `${airport.iata} — ${airport.name}` : airport.name}
                </button>
                {isAdmin && (
                  <button
                    className="icon-btn icon-btn--danger icon-btn--sm"
                    title="Retirer de la liste (les informations locales sont conservées)"
                    onClick={() => onRemoveAirportFromLocalNetwork(key)}
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