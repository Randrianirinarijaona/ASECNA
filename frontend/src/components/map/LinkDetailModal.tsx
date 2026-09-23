// components/map/LinkDetailModal.tsx
import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import type { Airport } from '../../types';
import {
  NETWORK_CATEGORY_LABELS,
  getNetworkLinkColor,
  LINK_DIRECTION_LABELS,
  LINK_STATUS_LABELS,
  LINK_STATUS_COLORS,
} from '../../data/networkCategories';
import type { NetworkLink, LinkStatus } from '../../data/networkCategories';
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
  // NOUVEAU : changement d'état de la liaison, réservé à l'admin.
  onUpdateStatus?: (linkId: string, status: LinkStatus) => void;
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
  onUpdateStatus,
}: LinkDetailModalProps) {
  const [newParamName, setNewParamName] = useState('');
  const [showAddParam, setShowAddParam] = useState(false);

  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);
  const [newValueName, setNewValueName] = useState('');
  const [newValueText, setNewValueText] = useState('');

  const parameters = link.parameters || [];
  const linkColor = getNetworkLinkColor(link.category, link.itemTitle);

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
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  display: 'inline-block',
                  background: linkColor,
                  marginRight: 6,
                }}
              />
              {NETWORK_CATEGORY_LABELS[link.category]} • {link.itemTitle}
            </p>
          </div>
          <div className="network-modal-header-actions">
            <button className="icon-btn" title="Fermer" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="network-modal-body network-modal-body--scroll">
          {/* NOUVEAU : bloc d'informations fixes de la liaison (direction,
              type, circuit, IP, port, statut). */}
          <div className="network-modal-category">
            <h3>Informations de la liaison</h3>
            <div className="network-item-grid-params">
              <div className="network-item-card sub-parameter-card">
                <span className="network-item-desc" style={{ margin: 0 }}>
                  <strong>Direction</strong> : {LINK_DIRECTION_LABELS[link.direction]}
                </span>
              </div>
              {link.linkType && (
                <div className="network-item-card sub-parameter-card">
                  <span className="network-item-desc" style={{ margin: 0 }}>
                    <strong>Type</strong> : {link.linkType}
                  </span>
                </div>
              )}
              {link.circuit && (
                <div className="network-item-card sub-parameter-card">
                  <span className="network-item-desc" style={{ margin: 0 }}>
                    <strong>Circuit</strong> : {link.circuit}
                  </span>
                </div>
              )}
              <div className="network-item-card sub-parameter-card">
                <span className="network-item-desc" style={{ margin: 0 }}>
                  <strong>@IP</strong> : {link.ipAddress}
                </span>
              </div>
              <div className="network-item-card sub-parameter-card">
                <span className="network-item-desc" style={{ margin: 0 }}>
                  <strong>Port</strong> : {link.port}
                </span>
              </div>
            </div>

            <div className="network-detail-footer" style={{ marginTop: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: LINK_STATUS_COLORS[link.status] }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    display: 'inline-block',
                    background: LINK_STATUS_COLORS[link.status],
                  }}
                />
                {LINK_STATUS_LABELS[link.status]}
              </span>

              {isAdmin && onUpdateStatus && (
                <select
                  className="form-input"
                  style={{ maxWidth: 200 }}
                  value={link.status}
                  onChange={(e) => onUpdateStatus(link.id, e.target.value as LinkStatus)}
                >
                  <option value="operational">Opérationnel</option>
                  <option value="maintenance">En maintenance</option>
                  <option value="out_of_service">Hors service</option>
                </select>
              )}
            </div>
          </div>

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