import { useState, useMemo } from 'react';
import { X, Trash2, Plus, Edit2, Check } from 'lucide-react';
import type { Airport } from '../../types';
import { NETWORK_CATEGORY_LABELS, getNetworkLinkColor } from '../../data/networkCategories';
import type { NetworkCategoryKey, NetworkLink } from '../../data/networkCategories';
import type { AirportsMap } from '../../hooks/useAirportsData';
import { ConfirmModal } from '../ui/Modal';

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
  onUpdateAirport?: (key: string, updates: { name?: string; iata?: string }) => void;
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
  onUpdateAirport,
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

  // Édition du nom / code IATA de l'aéroport (admin uniquement).
  const [editingAirport, setEditingAirport] = useState(false);
  const [editName, setEditName] = useState(airport.name);
  const [editIata, setEditIata] = useState(airport.iata);

  // Paramètre en attente de confirmation de suppression.
  const [itemToDelete, setItemToDelete] = useState<{
    category: NetworkCategoryKey;
    title: string;
  } | null>(null);

  // NOUVEAU : confirmation avant suppression de l'aéroport lui-même.
  const [confirmDeleteAirport, setConfirmDeleteAirport] = useState(false);

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

  const startEditingAirport = () => {
    setEditName(airport.name);
    setEditIata(airport.iata);
    setEditingAirport(true);
  };

  const saveAirportEdit = () => {
    if (!editName.trim() || !onUpdateAirport) return;
    onUpdateAirport(airportKey, {
      name: editName.trim(),
      iata: editIata.trim().toUpperCase(),
    });
    setEditingAirport(false);
  };

  return (
    <div className="network-modal-overlay">
      <div className="network-modal">
        <div className="network-modal-header">
          <div style={{ flex: 1 }}>
            {editingAirport ? (
              <div className="network-add-form" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <input
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Airport name"
                  autoFocus
                />
                <input
                  className="form-input"
                  value={editIata}
                  onChange={(e) => setEditIata(e.target.value)}
                  placeholder="Code IATA (optionnel)"
                  maxLength={3}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" disabled={!editName.trim()} onClick={saveAirportEdit}>
                    <Check size={14} /> Save
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingAirport(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2>
                  {airport.name} <span className="iata">({airport.iata || '—'})</span>
                </h2>
                <p className="network-modal-subtitle">Network parameter active</p>
              </>
            )}
          </div>
          <div className="network-modal-header-actions">
            {isAdmin && onUpdateAirport && !editingAirport && (
              <button
                className="icon-btn"
                title="setting Airport"
                onClick={startEditingAirport}
              >
                <Edit2 size={16} />
              </button>
            )}
            {isAdmin && (
              <button
                className="icon-btn icon-btn--danger"
                title="Delete this Airport"
                // MODIFIÉ : ouvre la confirmation au lieu de supprimer
                // immédiatement.
                onClick={() => setConfirmDeleteAirport(true)}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="icon-btn" title="close" onClick={onClose}>
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
                      title="Add parameter"
                      onClick={() => setAddingTo(addingTo === category ? null : category)}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {items.length === 0 && (
                  <p className="network-empty">No parameter</p>
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
                              setItemToDelete({ category, title: item.title });
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
                      placeholder="Parameter name (ex: AIDC)"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubmit(category)}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleAddSubmit(category)}>
                      Add
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

        {/* Confirmation avant suppression d'un paramètre */}
        <ConfirmModal
          isOpen={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          onConfirm={() => {
            if (itemToDelete) onDeleteItem(itemToDelete.category, itemToDelete.title);
            setItemToDelete(null);
          }}
          title="Supprimer le paramètre"
          message={`Voulez-vous vraiment supprimer le paramètre « ${itemToDelete?.title ?? ''} » ? Ses sous-paramètres et les liaisons associées seront également supprimés. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
        />

        {/* NOUVEAU : confirmation avant suppression de l'aéroport */}
        <ConfirmModal
          isOpen={confirmDeleteAirport}
          onClose={() => setConfirmDeleteAirport(false)}
          onConfirm={() => {
            setConfirmDeleteAirport(false);
            onDeleteAirport(airportKey);
          }}
          title="Supprimer l'aéroport"
          message={`Voulez-vous vraiment supprimer l'aéroport « ${airport.name} » ? Tous ses paramètres, ses liaisons, ses informations locales et ses points techniques locaux seront également supprimés. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
        />
      </div>
    </div>
  );
}