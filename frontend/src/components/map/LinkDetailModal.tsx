// components/map/LinkDetailModal.tsx
import { useState } from 'react';
import { X, Trash2, Plus, Edit2, Check } from 'lucide-react';
import type { Airport } from '../../types';
import {
  NETWORK_CATEGORY_LABELS,
  getNetworkLinkColor,
  LINK_DIRECTION_LABELS,
  LINK_STATUS_LABELS,
  LINK_STATUS_COLORS,
} from '../../data/networkCategories';
import type { NetworkLink, LinkStatus, LinkDirection } from '../../data/networkCategories';
import { ConfirmModal } from '../ui/Modal';
// @ts-ignore
import './NetworkItemModal.css';

interface LinkDetailModalProps {
  link: NetworkLink;
  fromAirport: Airport;
  toAirport: Airport;
  isAdmin: boolean;
  onClose: () => void;
  onUpdateLink?: (
    linkId: string,
    updates: {
      direction?: LinkDirection;
      linkType?: string;
      circuit?: string;
      ipAddress?: string;
      port?: string;
    }
  ) => void;
  onAddParameter: (linkId: string, name: string) => void;
  onUpdateParameter: (linkId: string, paramId: string, name: string) => void;
  onDeleteParameter: (linkId: string, paramId: string) => void;
  onAddValue: (linkId: string, paramId: string, name: string, text: string) => void;
  onUpdateValue: (linkId: string, paramId: string, valueId: string, name: string, text: string) => void;
  onDeleteValue: (linkId: string, paramId: string, valueId: string) => void;
  onUpdateStatus?: (linkId: string, status: LinkStatus) => void;
}

export default function LinkDetailModal({
  link,
  fromAirport,
  toAirport,
  isAdmin,
  onClose,
  onUpdateLink,
  onAddParameter,
  onUpdateParameter,
  onDeleteParameter,
  onAddValue,
  onUpdateValue,
  onDeleteValue,
  onUpdateStatus,
}: LinkDetailModalProps) {
  const [newParamName, setNewParamName] = useState('');
  const [showAddParam, setShowAddParam] = useState(false);

  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);
  const [newValueName, setNewValueName] = useState('');
  const [newValueText, setNewValueText] = useState('');

  const [editingParamId, setEditingParamId] = useState<string | null>(null);
  const [editParamName, setEditParamName] = useState('');

  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editValueName, setEditValueName] = useState('');
  const [editValueText, setEditValueText] = useState('');

  // NOUVEAU : éléments en attente de confirmation de suppression.
  const [paramToDelete, setParamToDelete] = useState<{ id: string; name: string } | null>(null);
  const [valueToDelete, setValueToDelete] = useState<{
    paramId: string;
    id: string;
    name: string;
  } | null>(null);

  const [editingInfo, setEditingInfo] = useState(false);
  const [editDirection, setEditDirection] = useState<LinkDirection>(link.direction);
  const [editLinkType, setEditLinkType] = useState(link.linkType || '');
  const [editCircuit, setEditCircuit] = useState(link.circuit || '');
  const [editIp, setEditIp] = useState(link.ipAddress);
  const [editPort, setEditPort] = useState(link.port);

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

  const startEditParam = (paramId: string, currentName: string) => {
    setEditingParamId(paramId);
    setEditParamName(currentName);
  };

  const saveEditParam = (paramId: string) => {
    if (!editParamName.trim()) return;
    onUpdateParameter(link.id, paramId, editParamName.trim());
    setEditingParamId(null);
  };

  const startEditValue = (valueId: string, currentName: string, currentText: string) => {
    setEditingValueId(valueId);
    setEditValueName(currentName);
    setEditValueText(currentText);
  };

  const saveEditValue = (paramId: string, valueId: string) => {
    if (!editValueName.trim() || !editValueText.trim()) return;
    onUpdateValue(link.id, paramId, valueId, editValueName.trim(), editValueText.trim());
    setEditingValueId(null);
  };

  const startEditInfo = () => {
    setEditDirection(link.direction);
    setEditLinkType(link.linkType || '');
    setEditCircuit(link.circuit || '');
    setEditIp(link.ipAddress);
    setEditPort(link.port);
    setEditingInfo(true);
  };

  const saveEditInfo = () => {
    if (!editIp.trim() || !editPort.trim()) return;
    onUpdateLink?.(link.id, {
      direction: editDirection,
      linkType: editLinkType.trim(),
      circuit: editCircuit.trim(),
      ipAddress: editIp.trim(),
      port: editPort.trim(),
    });
    setEditingInfo(false);
  };

  return (
    <div className="network-modal-overlay">
      <div className="network-modal network-item-modal ">
        <div className="network-modal-header">
          <div>
            <h2>
              Link between {fromAirport.name} and {toAirport.name}
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
          <div className="network-modal-category">
            <div className="network-modal-category-header">
              <h3>Link Informations</h3>
              {isAdmin && onUpdateLink && !editingInfo && (
                <button
                  className="icon-btn"
                  title="Modifier les informations de la liaison"
                  onClick={startEditInfo}
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>

            {editingInfo ? (
              <div
                className="network-add-form"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}
              >
                <label>Direction</label>
                <select
                  className="form-input"
                  value={editDirection}
                  onChange={(e) => setEditDirection(e.target.value as LinkDirection)}
                >
                  <option value="outgoing">{LINK_DIRECTION_LABELS.outgoing}</option>
                  <option value="incoming">{LINK_DIRECTION_LABELS.incoming}</option>
                  <option value="both">{LINK_DIRECTION_LABELS.both}</option>
                </select>

                <label>Type (optionnel)</label>
                <input
                  className="form-input"
                  value={editLinkType}
                  onChange={(e) => setEditLinkType(e.target.value)}
                  placeholder="ex: Fibre optique"
                />

                <label>Circuit (optionnel)</label>
                <input
                  className="form-input"
                  value={editCircuit}
                  onChange={(e) => setEditCircuit(e.target.value)}
                  placeholder="ex: CKT-042"
                />

                <label>@IP</label>
                <input
                  className="form-input"
                  value={editIp}
                  onChange={(e) => setEditIp(e.target.value)}
                  placeholder="ex: 10.2.0.5"
                />

                <label>Port</label>
                <input
                  className="form-input"
                  value={editPort}
                  onChange={(e) => setEditPort(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEditInfo()}
                  placeholder="ex: 8080"
                />

                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!editIp.trim() || !editPort.trim()}
                    onClick={saveEditInfo}
                  >
                    <Check size={13} /> Save
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingInfo(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
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
            )}

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
                  <option value="operational">Operational</option>
                  <option value="maintenance">Under maintenance</option>
                  <option value="out_of_service">Out of service</option>
                </select>
              )}
            </div>
          </div>

          <div className="network-modal-category">
            <div className="network-modal-category-header">
              <h3>Link parameters </h3>
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
              <p className="network-empty">No parameter configured for this link</p>
            )}

            {parameters.map((param) => (
              <div key={param.id} className="network-item-card" style={{ marginBottom: 10 }}>
                <div className="network-item-card-top">
                  {editingParamId === param.id ? (
                    <>
                      <input
                        className="form-input"
                        value={editParamName}
                        onChange={(e) => setEditParamName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditParam(param.id)}
                        autoFocus
                      />
                      <button
                        className="icon-btn icon-btn--sm"
                        title="Enregistrer"
                        onClick={() => saveEditParam(param.id)}
                      >
                        <Check size={13} />
                      </button>
                      <button
                        className="icon-btn icon-btn--sm"
                        title="Annuler"
                        onClick={() => setEditingParamId(null)}
                      >
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="network-item-title">{param.name}</span>
                      {isAdmin && (
                        <>
                          <button
                            className="icon-btn icon-btn--sm"
                            title="Modifier ce paramètre"
                            onClick={() => startEditParam(param.id, param.name)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="icon-btn icon-btn--danger icon-btn--sm"
                            title="Supprimer ce paramètre"
                            // MODIFIÉ : demande de confirmation au lieu
                            // d'une suppression immédiate.
                            onClick={() => setParamToDelete({ id: param.id, name: param.name })}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {param.values.length === 0 && (
                  <p className="network-empty">No value for this parameter</p>
                )}

                <div className="network-item-grid-params">
                  {param.values.map((value) => (
                    <div key={value.id} className="network-item-card sub-parameter-card">
                      {editingValueId === value.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6,}}>
                          <input
                            className="form-input"
                            placeholder="Nom de la valeur"
                            value={editValueName}
                            onChange={(e) => setEditValueName(e.target.value)}
                            autoFocus
                          />
                          <input
                            className="form-input"
                            placeholder="Valeur"
                            value={editValueText}
                            onChange={(e) => setEditValueText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditValue(param.id, value.id)}
                          />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => saveEditValue(param.id, value.id)}
                            >
                              <Check size={13} /> Save
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingValueId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="network-item-card-top">
                          <span className="network-item-desc" style={{ margin: 0 }}>
                            <strong>{value.name}</strong> : {value.text}
                          </span>
                          {isAdmin && (
                            <>
                              <div style={ {marginInlineStart: 'auto'} }>
                                <button
                                className="icon-btn icon-btn--sm"
                                title="Modifier cette valeur"
                                onClick={() => startEditValue(value.id, value.name, value.text)}
                              >
                                <Edit2 size={13} />
                              </button>
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
                              </div>
                            </>
                          )}
                        </div>
                      )}
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
                  placeholder="Nom du paramètre (ex: Réseau IP)"
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

        {/* NOUVEAU : confirmation avant suppression d'un paramètre de liaison */}
        <ConfirmModal
          isOpen={Boolean(paramToDelete)}
          onClose={() => setParamToDelete(null)}
          onConfirm={() => {
            if (paramToDelete) onDeleteParameter(link.id, paramToDelete.id);
            setParamToDelete(null);
          }}
          title="Supprimer le paramètre"
          message={`Voulez-vous vraiment supprimer le paramètre « ${paramToDelete?.name ?? ''} » et toutes ses valeurs ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
        />

        {/* NOUVEAU : confirmation avant suppression d'une valeur */}
        <ConfirmModal
          isOpen={Boolean(valueToDelete)}
          onClose={() => setValueToDelete(null)}
          onConfirm={() => {
            if (valueToDelete) onDeleteValue(link.id, valueToDelete.paramId, valueToDelete.id);
            setValueToDelete(null);
          }}
          title="Supprimer la valeur"
          message={`Voulez-vous vraiment supprimer la valeur « ${valueToDelete?.name ?? ''} » ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
        />
      </div>
    </div>
  );
}