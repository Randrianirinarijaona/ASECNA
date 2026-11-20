// components/map/LocalNetworkModal.tsx
// Informations locales d'UN aéroport réel OU d'un point technique local.
// Fonctionne exactement comme LinkDetailModal (paramètres de liaison) : un
// paramètre = un nom + une liste de valeurs nommées, sans notion de statut.
// Totalement indépendant des liaisons (NetworkLink) et des sections réseau
// (sfa/sma/srna).

import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import type { Airport, Parameter } from '../../types';
import { ConfirmModal } from '../ui/Modal';
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
  // Suppression de l'entité elle-même (point technique local), inchangée.
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

  // NOUVEAU : éléments en attente de confirmation de suppression.
  const [paramToDelete, setParamToDelete] = useState<{ id: string; name: string } | null>(null);
  const [valueToDelete, setValueToDelete] = useState<{
    paramId: string;
    id: string;
    name: string;
  } | null>(null);

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
            <p className="network-modal-subtitle">Local Informations</p>
          </div>
          <div className="network-modal-header-actions">
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

        <div className="network-modal-body">
          <div className="network-modal-category">
            <div className="network-modal-category-header">
              <h3>Local Paramètres</h3>
              {isAdmin && (
                <button
                  className="icon-btn"
                  title="Add parameter"
                  onClick={() => setShowAddParam(!showAddParam)}
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {localParameters.length === 0 && (
              <p className="network-empty">No local information configured for this Airport</p>
            )}

            {localParameters.map((param) => (
              <div key={param.id} className="network-item-card" style={{ marginBottom: 10 }}>
                <div className="network-item-card-top">
                  <span className="network-item-title">{param.name}</span>
                  {isAdmin && (
                    <button
                      className="icon-btn icon-btn--danger icon-btn--sm"
                      title="Delete"
                      // MODIFIÉ : demande de confirmation au lieu d'une
                      // suppression immédiate.
                      onClick={() => setParamToDelete({ id: param.id, name: param.name })}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {param.values.length === 0 && (
                  <p className="network-empty">No value</p>
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
                            // MODIFIÉ : demande de confirmation.
                            onClick={() =>
                              setValueToDelete({ paramId: param.id, id: value.id, name: value.name })
                            }
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
                          placeholder="Value name (ex: IP)"
                          value={newValueName}
                          onChange={(e) => setNewValueName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddValue(param.id)}
                          autoFocus
                        />
                        <input
                          className="form-input"
                          placeholder="Value (ex: 10.10.2.50) "
                          value={newValueText}
                          onChange={(e) => setNewValueText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddValue(param.id)}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => handleAddValue(param.id)}>
                          Add
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
                        <Plus size={12} /> Add value
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
                  placeholder="Parameter name (ex: Adress)"
                  value={newParamName}
                  onChange={(e) => setNewParamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddParameter()}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddParameter}>
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NOUVEAU : confirmation avant suppression d'un paramètre local */}
        <ConfirmModal
          isOpen={Boolean(paramToDelete)}
          onClose={() => setParamToDelete(null)}
          onConfirm={() => {
            if (paramToDelete) onDeleteParameter(paramToDelete.id);
            setParamToDelete(null);
          }}
          title="Delete parameter"
          message={`Do you want delete this parameter « ${paramToDelete?.name ?? ''} » et toutes ses valeurs ? Cette action est irréversible.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />

        {/* NOUVEAU : confirmation avant suppression d'une valeur locale */}
        <ConfirmModal
          isOpen={Boolean(valueToDelete)}
          onClose={() => setValueToDelete(null)}
          onConfirm={() => {
            if (valueToDelete) onDeleteValue(valueToDelete.paramId, valueToDelete.id);
            setValueToDelete(null);
          }}
          title="Delete value"
          message={`Do you want delete this value « ${valueToDelete?.name ?? ''} » ? Cette action est irréversible.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
}