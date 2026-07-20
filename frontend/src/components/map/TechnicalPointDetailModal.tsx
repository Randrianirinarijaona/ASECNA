// components/map/TechnicalPointDetailModal.tsx
// Onglet dédié à UN point technique du "Réseau local" (relais VHF/HF,
// antenne...) placé directement sur la carte. Comportement calqué sur
// LinkDetailModal : un onglet vide à l'ouverture, dans lequel l'admin
// ajoute librement des paramètres de configuration (titre + valeur),
// réutilisant le même mécanisme CRUD que les sous-paramètres d'un item
// réseau classique (addItemSubParameter / deleteItemSubParameter /
// toggleItemSubParameterStatus).

import { useState } from 'react';
import { X, Trash2, Plus, MapPin } from 'lucide-react';
import type { Airport } from '../../types';
import type { NetworkSubParameter } from '../../types';
import type { NetworkCategoryKey } from '../../data/networkCategories';
// @ts-ignore
import './NetworkItemModal.css';

interface TechnicalPointDetailModalProps {
  airportKey: string;
  airport: Airport;
  category: NetworkCategoryKey;
  itemTitle: string;
  subParameters: NetworkSubParameter[];
  isAdmin: boolean;
  onClose: () => void;
  onAddSubParameter: (title: string, value: string) => void;
  onDeleteSubParameter: (subId: string) => void;
  onToggleSubParameterStatus: (subId: string) => void;
  onDeletePoint: () => void;
}

export default function TechnicalPointDetailModal({
  airport,
  itemTitle,
  subParameters,
  isAdmin,
  onClose,
  onAddSubParameter,
  onDeleteSubParameter,
  onToggleSubParameterStatus,
  onDeletePoint,
}: TechnicalPointDetailModalProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(subParameters.length === 0);

  const handleAdd = () => {
    if (!newTitle.trim() || !newValue.trim()) return;
    onAddSubParameter(newTitle.trim(), newValue.trim());
    setNewTitle('');
    setNewValue('');
  };

  return (
    <div className="network-modal-overlay">
      <div className="network-modal network-item-modal">
        <div className="network-modal-header">
          <div>
            <h2>{airport.name}</h2>
            <p className="network-modal-subtitle">
              <MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {itemTitle} • {airport.coords[0].toFixed(5)}, {airport.coords[1].toFixed(5)}
            </p>
          </div>
          <div className="network-modal-header-actions">
            {isAdmin && (
              <button
                className="icon-btn icon-btn--danger"
                title="Supprimer ce point technique"
                onClick={onDeletePoint}
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
          <div className="network-modal-category">
            <div className="network-modal-category-header">
              <h3>Configuration du point</h3>
              {isAdmin && (
                <button
                  className="icon-btn"
                  title="Ajouter un paramètre"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {subParameters.length === 0 && (
              <p className="network-empty">
                Aucun paramètre configuré pour ce point technique
              </p>
            )}

            <div className="network-item-grid">
              {subParameters.map((sub) => (
                <div key={sub.id} className="network-item-card sub-parameter-card">
                  <div className="network-item-card-top">
                    <span className={`status-dot status-dot--${sub.status}`} />
                    <span className="network-item-title">{sub.title}</span>
                    {isAdmin && (
                      <>
                        <button
                          className="icon-btn icon-btn--sm"
                          onClick={() => onToggleSubParameterStatus(sub.id)}
                          title="Changer statut"
                        >
                          {sub.status === 'operational' ? 'M' : 'O'}
                        </button>
                        <button
                          className="icon-btn icon-btn--danger icon-btn--sm"
                          onClick={() => onDeleteSubParameter(sub.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="network-item-desc">
                    <strong>Valeur :</strong> {sub.value}
                  </p>
                </div>
              ))}
            </div>

            {isAdmin && showAddForm && (
              <div className="network-add-form">
                <input
                  className="form-input"
                  placeholder="Nom du paramètre (ex: Fréquence)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
                <input
                  className="form-input"
                  placeholder="Valeur (ex: 123.450 MHz)"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAdd}>
                  Ajouter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}