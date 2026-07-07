//NetworkModal.tsx
// Modal affichant, pour UN aéroport donné, tous ses paramètres réseau
// regroupés par catégorie (SFA / SMA / SRNA).
// La gestion des liaisons (création/suppression) a été déplacée vers
// NetworkItemModal — ce composant ne fait plus qu'ouvrir la vue détaillée.

import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import type { Airport } from '../../types';
import { NETWORK_CATEGORY_LABELS } from '../../data/networkCategories';
import type { NetworkCategoryKey, NetworkLink } from '../../data/networkCategories';
import type { AirportsMap } from '../../hooks/useAirportsData';

import NetworkItemModal from './NetworkItemModal';

// @ts-ignore
import './NetworkModal.css';

interface NetworkItemInput {
  title: string;
  status: 'operational' | 'maintenance';
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
  onStartLink: (category: NetworkCategoryKey, itemTitle: string) => void;
  onDeleteLink: (linkId: string) => void;
  // Nouveau : permet à NetworkItemModal (imbriqué) de faire basculer l'affichage
  // sur un autre aéroport quand on clique sur un aéroport lié
  onNavigateToAirport: (key: string) => void;
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
  onStartLink,
  onDeleteLink,
  onNavigateToAirport,
}: NetworkModalProps) {
  const [addingTo, setAddingTo] = useState<NetworkCategoryKey | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Item ouvert dans la vue détaillée (NetworkItemModal). On garde le statut
  // réel de l'item même s'il n'est plus affiché ici, pour ne pas le perdre
  // quand on ouvre le modal détaillé.
  const [selectedItem, setSelectedItem] = useState<{
    category: NetworkCategoryKey;
    title: string;
    description?: string;
    status: 'operational' | 'maintenance';
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

        {/* "network-modal-body--scroll" : limite la hauteur du corps du modal et
            affiche une barre de défilement verticale quand la liste des paramètres
            dépasse l'espace disponible (voir CSS à ajouter en fin de message) */}
        <div className="network-modal-body network-modal-body--scroll">
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
                    <div key={item.title} className="network-item-card">
                      <div
                        className="network-item-card-top"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          setSelectedItem({
                            category,
                            title: item.title,
                            description: item.description,
                            status: item.status || 'operational',
                          })
                        }
                      >
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
            itemStatus={selectedItem.status}
            itemDescription={selectedItem.description}
            airportName={airport.name}
            category={selectedItem.category}
            airportKey={airportKey}
            links={links}
            allAirports={allAirports}
            isAdmin={isAdmin}
            onClose={() => setSelectedItem(null)}
            onUpdateItem={(newTitle, newStatus, newDesc) => {
              console.log('Mise à jour item:', newTitle, newStatus, newDesc);
              setSelectedItem(null);
            }}
            onStartLink={() => {
              onStartLink(selectedItem.category, selectedItem.title);
              setSelectedItem(null); // ferme le modal pour libérer le clic sur la carte
            }}
            onDeleteLink={onDeleteLink}
            onNavigateToAirport={(key) => {
              setSelectedItem(null); // évite de garder un item "fantôme" ouvert sur le nouvel aéroport
              onNavigateToAirport(key);
            }}
          />
        )}
      </div>
    </div>
  );
}