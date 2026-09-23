// components/map/LocalNetworkModal.tsx
// Informations locales d'UN aéroport réel OU d'un point technique local.
// Fonctionne exactement comme LinkDetailModal (paramètres de liaison) : un
// paramètre = un nom + une liste de valeurs nommées, sans notion de statut.
// Totalement indépendant des liaisons (NetworkLink) et des sections réseau
// (sfa/sma/srna).

import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import type { Airport, Parameter } from '../../types';
// @ts-ignore
import './NetworkItemModal.css';

interface LocalNetworkModalProps {
  airport: Airport;
  localParameters: Parameter[];
  isAdmin: boolean;
  onClose: () => void;
  onAddParameter: (name: string) => void;
  onDeleteParameter: (paramId: string) => void;
  onAddValue: (paramId: string, name: string, text: string) => void;
  onDeleteValue: (paramId: string, valueId: string) => void;
  // NOUVEAU : suppression de l'entité elle-même (point technique local).
  // Optionnel — si absent, aucun bouton de suppression n'est affiché
  // (comportement inchangé pour tout appelant qui ne le fournit pas).
  onDelete?: () => void;
}

export default function LocalNetworkModal({
  airport,
  localParameters,
  isAdmin,
  onClose,
  onAddParameter,
  onDeleteParameter,
  onAddValue,
  onDeleteValue,
  onDelete,
}: LocalNetworkModalProps) {
  const [newParamName, setNewParamName] = useState('');
  const [showAddParam, setShowAddParam] = useState(false);

  // Formulaire d'ajout de valeur ouvert pour au plus un paramètre à la fois.
  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);
  const [newValueName, setNewValueName] = useState('');
  const [newValueText, setNewValueText] = useState('');

  const handleAddParameter = () => {
    if (!newParamName.trim()) return;
    onAddParameter(newParamName.trim());
    setNewParamName('');
    setShowAddParam(false);
  };

  const handleAddValue = (paramId: string) => {
    if (!newValueName.trim() || !newValueText.trim()) return;
    onAddValue(paramId, newValueName.trim(), newValueText.trim());
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
              {airport.name} {airport.iata && <span className="iata">({airport.iata})</span>}
            </h2>
            <p className="network-modal-subtitle">Informations locales</p>
          </div>
          <div className="network-modal-header-actions">
            {/* NOUVEAU : bouton de suppression du point technique local,
                réutilise exactement le style/emplacement du bouton
                "Supprimer cet aéroport" de NetworkModal.tsx. */}
            {isAdmin && onDelete && (
              <button
                className="icon-btn icon-btn--danger"
                title="Supprimer ce point technique"
                onClick={onDelete}
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
          <div className="network-modal-category">
            <div className="network-modal-category-header">
              <h3>Paramètres locaux</h3>
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

            {localParameters.length === 0 && (
              <p className="network-empty">Aucune information locale configurée pour cet aéroport</p>
            )}

            {localParameters.map((param) => (
              <div key={param.id} className="network-item-card" style={{ marginBottom: 10 }}>
                <div className="network-item-card-top">
                  <span className="network-item-title">{param.name}</span>
                  {isAdmin && (
                    <button
                      className="icon-btn icon-btn--danger icon-btn--sm"
                      title="Supprimer ce paramètre"
                      onClick={() => onDeleteParameter(param.id)}
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
                            onClick={() => onDeleteValue(param.id, value.id)}
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
                          placeholder="Nom de la valeur (ex: Groupe électrogène)"
                          value={newValueName}
                          onChange={(e) => setNewValueName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddValue(param.id)}
                          autoFocus
                        />
                        <input
                          className="form-input"
                          placeholder="Valeur (ex: Opérationnel, testé le 12/07)"
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
                  placeholder="Nom du paramètre (ex: Alimentation électrique)"
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