// components/map/LinkDetailModal.tsx
// Onglet dédié à UNE liaison précise entre deux aéroports.
// Affiche les paramètres propres à cette liaison (ex: "Réseau IP"), chacun
// pouvant contenir plusieurs valeurs nommées librement par l'admin
// (ex: "Adresse IP : 10.2.0.0", "Masque réseau : 255.255.255.0").

import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import type { Airport } from '../../types';
import { NETWORK_CATEGORY_LABELS } from '../../data/networkCategories';
import type { NetworkLink } from '../../data/networkCategories';
// @ts-ignore
import './NetworkItemModal.css';

interface LinkDetailModalProps {
  link: NetworkLink;
  fromAirport: Airport;
  toAirport: Airport;
  isAdmin: boolean;
  onClose: () => void;
  onAddParameter: (linkId: string, name: string) => void;
  onDeleteParameter: (linkId: string, paramId: string) => void;
  onAddValue: (linkId: string, paramId: string, name: string, text: string) => void;
  onDeleteValue: (linkId: string, paramId: string, valueId: string) => void;
}

export default function LinkDetailModal({
  link,
  fromAirport,
  toAirport,
  isAdmin,
  onClose,
  onAddParameter,
  onDeleteParameter,
  onAddValue,
  onDeleteValue,
}: LinkDetailModalProps) {
  const [newParamName, setNewParamName] = useState('');
  const [showAddParam, setShowAddParam] = useState(false);

  // Formulaire d'ajout de valeur ouvert pour au plus un paramètre à la fois.
  // On saisit maintenant le nom ET le texte de la valeur.
  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);
  const [newValueName, setNewValueName] = useState('');
  const [newValueText, setNewValueText] = useState('');

  const parameters = link.parameters || [];

  const handleAddParameter = () => {
    if (!newParamName.trim()) return;
    onAddParameter(link.id, newParamName.trim());
    setNewParamName('');
    setShowAddParam(false);
  };

  const handleAddValue = (paramId: string) => {
    if (!newValueName.trim() || !newValueText.trim()) return;
    onAddValue(link.id, paramId, newValueName.trim(), newValueText.trim());
    setNewValueName('');
    setNewValueText('');
    setAddingValueFor(null);
  };

  return (
    <div className="network-modal-overlay">
      <div className="network-modal network-item-modal">
        <div className="network-modal-header">
          <div>
            <h2>
              Liaison entre {fromAirport.name} et {toAirport.name}
            </h2>
            <p className="network-modal-subtitle">
              {NETWORK_CATEGORY_LABELS[link.category]} • {link.itemTitle}
            </p>
          </div>
          <div className="network-modal-header-actions">
            <button className="icon-btn" title="Fermer" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="network-modal-body">
          <div className="network-modal-category">
            <div className="network-modal-category-header">
              <h3>Paramètres de la liaison</h3>
              {isAdmin && (
                <button
                  className="icon-btn"
                  title="Ajouter un paramètre"
                  onClick={() => setShowAddParam(!showAddParam)}
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {parameters.length === 0 && (
              <p className="network-empty">Aucun paramètre configuré pour cette liaison</p>
            )}

            {parameters.map((param) => (
              <div key={param.id} className="network-item-card" style={{ marginBottom: 10 }}>
                <div className="network-item-card-top">
                  <span className="network-item-title">{param.name}</span>
                  {isAdmin && (
                    <button
                      className="icon-btn icon-btn--danger icon-btn--sm"
                      title="Supprimer ce paramètre"
                      onClick={() => onDeleteParameter(link.id, param.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {param.values.length === 0 && (
                  <p className="network-empty">Aucune valeur pour ce paramètre</p>
                )}

                <div className="network-item-grid-params">
                  {param.values.map((value) => (
                    <div key={value.id} className="network-item-card sub-parameter-card">
                      <div className="network-item-card-top">
                        <span className="network-item-desc" style={{ margin: 0 }}>
                          <strong>{value.name}</strong> : {value.text}
                        </span>
                        {isAdmin && (
                          <button
                            className="icon-btn icon-btn--danger icon-btn--sm"
                            title="Supprimer cette valeur"
                            onClick={() => onDeleteValue(link.id, param.id, value.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <>
                    {addingValueFor === param.id ? (
                      <div className="network-add-form" style={{ flexDirection: 'column', gap: 6 }}>
                        <input
                          className="form-input"
                          placeholder="Nom de la valeur (ex: Adresse IP)"
                          value={newValueName}
                          onChange={(e) => setNewValueName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddValue(param.id)}
                          autoFocus
                        />
                        <input
                          className="form-input"
                          placeholder="Valeur (ex: 10.2.0.5)"
                          value={newValueText}
                          onChange={(e) => setNewValueText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddValue(param.id)}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => handleAddValue(param.id)}>
                          Ajouter
                        </button>
                      </div>
                    ) : (
                      <button
                        className="sidebar-action-btn"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                          setAddingValueFor(param.id);
                          setNewValueName('');
                          setNewValueText('');
                        }}
                      >
                        <Plus size={12} /> Ajouter une valeur
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}

            {showAddParam && (
              <div className="network-add-form">
                <input
                  className="form-input"
                  placeholder="Nom du paramètre (ex: Réseau IP)"
                  value={newParamName}
                  onChange={(e) => setNewParamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddParameter()}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddParameter}>
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