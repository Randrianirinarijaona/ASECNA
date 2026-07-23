import { useState, useMemo } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import type { Airport } from '../../types';
import { NETWORK_CATEGORY_LABELS, getNetworkLinkColor } from '../../data/networkCategories';
import type { NetworkCategoryKey, NetworkLink } from '../../data/networkCategories';
import type { AirportsMap } from '../../hooks/useAirportsData';

import NetworkItemModal from './NetworkItemModal';
// @ts-ignore: CSS side-effect import handled by build tooling
import './NetworkModal.css';

interface NetworkItemInput {
  title: string;
  status?: 'operational' | 'maintenance' | 'planned';
}

interface NetworkModalProps {
  airportKey: string;
  airport: Airport;
  isAdmin: boolean;
  allAirports: AirportsMap;
  links: NetworkLink[];
  onClose: () => void;
  onDeleteAirport: (key: string) => void;
  onAddItem: (category: NetworkCategoryKey, item: NetworkItemInput) => void;
  onDeleteItem: (category: NetworkCategoryKey, title: string) => void;
  onUpdateItemStatus: (
    airportKey: string,
    category: NetworkCategoryKey,
    itemTitle: string,
    status: 'operational' | 'maintenance'
  ) => void;
  onUpdateItemDescription: (
    airportKey: string,
    category: NetworkCategoryKey,
    itemTitle: string,
    description: string
  ) => void;
  onAddSubParameter: (
    airportKey: string,
    category: NetworkCategoryKey,
    itemTitle: string,
    title: string,
    value: string
  ) => void;
  onDeleteSubParameter: (
    airportKey: string,
    category: NetworkCategoryKey,
    itemTitle: string,
    subId: string
  ) => void;
  onToggleSubParameterStatus: (
    airportKey: string,
    category: NetworkCategoryKey,
    itemTitle: string,
    subId: string
  ) => void;
  onStartLink: (category: NetworkCategoryKey, itemTitle: string) => void;
  onDeleteLink: (linkId: string) => void;
  onOpenLinkDetail: (linkId: string) => void;
}

const CATEGORIES: NetworkCategoryKey[] = ['sfa', 'sma', 'srna'];

export default function NetworkModal({
  airportKey,
  airport,
  isAdmin,
  allAirports,
  links,
  onClose,
  onDeleteAirport,
  onAddItem,
  onDeleteItem,
  onUpdateItemStatus,
  onUpdateItemDescription,
  onAddSubParameter,
  onDeleteSubParameter,
  onToggleSubParameterStatus,
  onStartLink,
  onDeleteLink,
  onOpenLinkDetail,
}: NetworkModalProps) {
  const [addingTo, setAddingTo] = useState<NetworkCategoryKey | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const [selectedItemKey, setSelectedItemKey] = useState<{
    category: NetworkCategoryKey;
    title: string;
  } | null>(null);

  const selectedItem = useMemo(() => {
    if (!selectedItemKey) return null;
    const items = airport.sections[selectedItemKey.category] || [];
    const item = items.find((i) => i.title === selectedItemKey.title);
    return item ? { ...item, category: selectedItemKey.category } : null;
  }, [selectedItemKey, airport]);

  const handleAddSubmit = (category: NetworkCategoryKey) => {
    if (!newTitle.trim()) return;
    const item: NetworkItemInput =
      category === 'sfa'
        ? { title: newTitle.trim() }
        : { title: newTitle.trim(), status: 'operational' };
    onAddItem(category, item);
    setNewTitle('');
    setAddingTo(null);
  };

  return (
    <div className="network-modal-overlay">
      <div className="network-modal">
        <div className="network-modal-header">
          <div>
            <h2>
              {airport.name} <span className="iata">({airport.iata})</span>
            </h2>
            <p className="network-modal-subtitle">Paramètres du réseau actif</p>
          </div>
          <div className="network-modal-header-actions">
            {isAdmin && (
              <button
                className="icon-btn icon-btn--danger"
                title="Supprimer cet aéroport"
                onClick={() => onDeleteAirport(airportKey)}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="icon-btn" title="Fermer" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="network-modal-body network-modal-body--scroll">
          {CATEGORIES.map((category) => {
            const items = airport.sections[category] || [];

            return (
              <div key={category} className="network-modal-category">
                <div className="network-modal-category-header">
                  <h3>{NETWORK_CATEGORY_LABELS[category]}</h3>
                  {isAdmin && (
                    <button
                      className="icon-btn icon-btn--sm"
                      title="Ajouter un paramètre"
                      onClick={() => setAddingTo(addingTo === category ? null : category)}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {items.length === 0 && (
                  <p className="network-empty">Aucun paramètre configuré</p>
                )}

                <div className="network-item-grid">
                  {items.map((item) => (
                    <div key={item.title} className="network-item-card text-left">
                      <div
                        className="network-item-card-top"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedItemKey({ category, title: item.title })}
                      >
                        {category === 'sfa' ? (
                          <span
                            title="Couleur de liaison associée"
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              display: 'inline-block',
                              background: getNetworkLinkColor('sfa', item.title),
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <span className={`status-dot status-dot--${item.status || 'operational'}`} />
                        )}
                        <span className="network-item-title">{item.title}</span>

                        {isAdmin && (
                          <button
                            className="icon-btn icon-btn--danger icon-btn--sm"
                            title="Supprimer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteItem(category, item.title);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {item.description && <p className="network-item-desc">{item.description}</p>}
                    </div>
                  ))}
                </div>

                {addingTo === category && (
                  <div className="network-add-form">
                    <input
                      className="form-input"
                      placeholder="Nom du paramètre (ex: AIDC)"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubmit(category)}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleAddSubmit(category)}>
                      Ajouter
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedItem && (
          <NetworkItemModal
            itemTitle={selectedItem.title}
            itemStatus={(selectedItem.status as 'operational' | 'maintenance') || 'operational'}
            itemDescription={selectedItem.description}
            subParameters={selectedItem.subParameters || []}
            airportName={airport.name}
            category={selectedItem.category}
            airportKey={airportKey}
            links={links}
            allAirports={allAirports}
            isAdmin={isAdmin}
            hideStatus={selectedItem.category === 'sfa'}
            onClose={() => setSelectedItemKey(null)}
            onUpdateItem={(newTitle, newStatus, newDesc) => {
              if (selectedItem.category !== 'sfa') {
                onUpdateItemStatus(airportKey, selectedItem.category, selectedItem.title, newStatus);
              }
              if ((newDesc || '') !== (selectedItem.description || '')) {
                onUpdateItemDescription(airportKey, selectedItem.category, selectedItem.title, newDesc || '');
              }
            }}
            onAddSubParameter={(title, value) =>
              onAddSubParameter(airportKey, selectedItem.category, selectedItem.title, title, value)
            }
            onDeleteSubParameter={(subId) =>
              onDeleteSubParameter(airportKey, selectedItem.category, selectedItem.title, subId)
            }
            onToggleSubParameterStatus={(subId) =>
              onToggleSubParameterStatus(airportKey, selectedItem.category, selectedItem.title, subId)
            }
            onStartLink={() => {
              onStartLink(selectedItem.category, selectedItem.title);
              setSelectedItemKey(null);
            }}
            onDeleteLink={onDeleteLink}
            onOpenLinkDetail={onOpenLinkDetail}
          />
        )}
      </div>
    </div>
  );
}