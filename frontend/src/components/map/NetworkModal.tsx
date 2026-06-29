import { useState } from 'react';
import { X, Trash2, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { Airport } from '../../types';
import { NETWORK_CATEGORY_LABELS } from '../../data/networkCategories';
import type { NetworkCategoryKey } from '../../data/networkCategories';

// Import du nouveau modal
import NetworkItemModal from './NetworkItemModal';

// @ts-ignore: Allow side-effect CSS import without type declarations
import './NetworkModal.css';

interface NetworkItemInput {
  title: string;
  status: 'operational' | 'maintenance';
}

interface NetworkModalProps {
  airportKey: string;
  airport: Airport;
  isAdmin: boolean;
  onClose: () => void;
  onDeleteAirport: (key: string) => void;
  onAddItem: (category: NetworkCategoryKey, item: NetworkItemInput) => void;
  onDeleteItem: (category: NetworkCategoryKey, title: string) => void;
  onUpdateItemStatus?: (
    category: NetworkCategoryKey,
    title: string,
    status: 'operational' | 'maintenance'
  ) => void;
}

const CATEGORIES: NetworkCategoryKey[] = ['sfa', 'sma', 'srna'];

export default function NetworkModal({
  airportKey,
  airport,
  isAdmin,
  onClose,
  onDeleteAirport,
  onAddItem,
  onDeleteItem,
}: NetworkModalProps) {
  const [addingTo, setAddingTo] = useState<NetworkCategoryKey | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // ←←← NOUVEL ÉTAT POUR LE MODAL DÉTAILLÉ
  const [selectedItem, setSelectedItem] = useState<{
    title: string;
    status: 'operational' | 'maintenance';
    description?: string;
  } | null>(null);

  const handleAddSubmit = (category: NetworkCategoryKey) => {
    if (!newTitle.trim()) return;
    onAddItem(category, { title: newTitle.trim(), status: 'operational' });
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

        <div className="network-modal-body">
          {CATEGORIES.map((category) => {
            const items = airport.sections[category] || [];
            return (
              <div key={category} className="network-modal-category">
                <div className="network-modal-category-header">
                  <h3>{NETWORK_CATEGORY_LABELS[category]}</h3>
                  {isAdmin && (
                    <button
                      className="icon-btn"
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
                    <div
                      key={item.title}
                      className="network-item-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedItem({
                        title: item.title,
                        status: item.status || 'operational',
                        description: item.description,
                      })}
                    >
                      <div className="network-item-card-top">
                        <span className={`status-dot status-dot--${item.status || 'operational'}`} />
                        <span className="network-item-title">{item.title}</span>
                        {isAdmin && (
                          <button
                            className="icon-btn icon-btn--danger icon-btn--sm"
                            title="Supprimer"
                            onClick={(e) => {
                              e.stopPropagation(); // Empêche l'ouverture du modal en cliquant sur supprimer
                              onDeleteItem(category, item.title);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      {item.description && <p className="network-item-desc">{item.description}</p>}
                      <span className={`status-label status-label--${item.status || 'operational'}`}>
                        {item.status === 'maintenance' ? (
                          <>
                            <AlertTriangle size={12} /> Maintenance
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={12} /> Opérationnel
                          </>
                        )}
                      </span>
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

        {/* ====================== MODAL DÉTAILLÉ ====================== */}
        {selectedItem && (
          <NetworkItemModal
            itemTitle={selectedItem.title}
            itemStatus={selectedItem.status}
            itemDescription={selectedItem.description}
            airportName={airport.name}
            isAdmin={isAdmin}
            onClose={() => setSelectedItem(null)}
            onUpdateItem={(newTitle, newStatus, newDesc) => {
              console.log('Mise à jour item:', newTitle, newStatus, newDesc);
              // Tu pourras plus tard mettre à jour le state de l'aéroport ici
              setSelectedItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
}