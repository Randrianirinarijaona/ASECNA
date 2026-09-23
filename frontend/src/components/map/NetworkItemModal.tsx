import { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Edit2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { NETWORK_CATEGORY_LABELS, getNetworkLinkColor, ANTANANARIVO_AIRPORT_KEY } from '../../data/networkCategories';
import type { NetworkCategoryKey, NetworkLink } from '../../data/networkCategories';
import type { AirportsMap } from '../../hooks/useAirportsData';
import type { NetworkSubParameter } from '../../types';
// @ts-ignore: CSS side-effect import handled by build tooling
import './NetworkItemModal.css';

interface NetworkItemModalProps {
  itemTitle: string;
  itemStatus: 'operational' | 'maintenance';
  itemDescription?: string;
  subParameters: NetworkSubParameter[];
  airportName: string;
  isAdmin: boolean;
  hideStatus?: boolean;
  onClose: () => void;
  onUpdateItem?: (
    newTitle: string,
    newStatus: 'operational' | 'maintenance',
    newDesc?: string
  ) => void;
  onAddSubParameter?: (title: string, value: string) => void;
  onDeleteSubParameter?: (subId: string) => void;
  onToggleSubParameterStatus?: (subId: string) => void;
  category?: NetworkCategoryKey;
  airportKey?: string;
  links?: NetworkLink[];
  allAirports?: AirportsMap;
  onStartLink?: () => void;
  onDeleteLink?: (linkId: string) => void;
  onOpenLinkDetail?: (linkId: string) => void;
}

export default function NetworkItemModal({
  itemTitle,
  itemStatus,
  itemDescription,
  subParameters,
  airportName,
  isAdmin,
  hideStatus = false,
  onClose,
  onUpdateItem,
  onAddSubParameter,
  onDeleteSubParameter,
  onToggleSubParameterStatus,
  category,
  airportKey,
  links,
  allAirports,
  onStartLink,
  onDeleteLink,
  onOpenLinkDetail,
}: NetworkItemModalProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(itemTitle);
  const [editStatus, setEditStatus] = useState(itemStatus);
  const [editDesc, setEditDesc] = useState(itemDescription || '');

  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubValue, setNewSubValue] = useState('');
  const [showAddSub, setShowAddSub] = useState(false);

  const toggleGlobalStatus = () => {
    const newStatus = editStatus === 'operational' ? 'maintenance' : 'operational';
    setEditStatus(newStatus);
    if (!editing && onUpdateItem) {
      onUpdateItem(editTitle, newStatus, editDesc);
    }
  };

  const handleSaveItem = () => {
    onUpdateItem?.(editTitle, editStatus, editDesc);
    setEditing(false);
  };

  const addSubParameter = () => {
    if (!newSubTitle.trim() || !newSubValue.trim()) return;
    onAddSubParameter?.(newSubTitle.trim(), newSubValue.trim());
    setNewSubTitle('');
    setNewSubValue('');
    setShowAddSub(false);
  };

  const hasLinkContext =
    Boolean(category && category !== 'sma' && airportKey && links && allAirports);

  const matchesItem = (linkItemTitle: string) => {
    const a = linkItemTitle.toLowerCase();
    const b = itemTitle.toLowerCase();
    return a === b || a.includes(b) || b.includes(a);
  };

  const linkedAirports = hasLinkContext
    ? links!
        .filter(
          (l) =>
            l.category === category &&
            matchesItem(l.itemTitle) &&
            (l.fromAirportKey === airportKey || l.toAirportKey === airportKey)
        )
        .map((l) => {
          const otherKey = l.fromAirportKey === airportKey ? l.toAirportKey : l.fromAirportKey;
          const other = allAirports![otherKey];
          return {
            linkId: l.id,
            key: otherKey,
            name: other?.name ?? 'Aéroport supprimé',
            iata: other?.iata ?? '—',
          };
        })
    : [];

  const linkColor = category ? getNetworkLinkColor(category, itemTitle) : undefined;

  // NOUVEAU : une nouvelle liaison ne peut être démarrée que depuis
  // Antananarivo (cf. contrainte "point de départ obligatoire").
  const canStartLinkFromHere = airportKey === ANTANANARIVO_AIRPORT_KEY;

  return (
    <div className="network-modal-overlay">
      <div className="network-modal network-item-modal">
        <div className="network-modal-header">
          <div>
            <h2>{itemTitle}</h2>
            <p className="network-modal-subtitle">
              {category ? `${NETWORK_CATEGORY_LABELS[category]} • ` : ''}
              {airportName}
            </p>
          </div>
          <div className="network-modal-header-actions">
            {isAdmin && (
              <>
                <button
                  className={`icon-btn ${editing ? 'icon-btn--active' : ''}`}
                  title="Modifier"
                  onClick={() => setEditing(!editing)}
                >
                  <Edit2 size={16} />
                </button>
                {!hideStatus && (
                  <button
                    className={`icon-btn ${editStatus === 'operational' ? 'status-operational' : 'status-maintenance'}`}
                    title="Changer statut global"
                    onClick={toggleGlobalStatus}
                  >
                    {editStatus === 'operational' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                )}
              </>
            )}
            <button className="icon-btn" title="Fermer" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="network-modal-body network-modal-body--scroll">
          <div className="network-item-detail">
            <div className="network-item-card-top">
              {!hideStatus && <span className={`status-dot status-dot--${editStatus}`} />}
              {editing ? (
                <input
                  className="form-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
              ) : (
                <span className="network-item-title-large">{itemTitle}</span>
              )}
            </div>

            {editing ? (
              <textarea
                className="form-input"
                placeholder="Description du paramètre"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={3}
                style={{ marginTop: '10px', marginBottom: '10px' }}
              />
            ) : (
              itemDescription && <p className="network-item-desc-main">{itemDescription}</p>
            )}

            <div className="network-detail-footer">
              {!hideStatus && (
                <span className={`status-label status-label--${editStatus}`}>
                  {editStatus === 'maintenance' ? (
                    <>
                      <AlertTriangle size={13} /> En Maintenance
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={13} /> Opérationnel
                    </>
                  )}
                </span>
              )}

              {editing && (
                <button className="btn btn-primary btn-sm" onClick={handleSaveItem}>
                  Enregistrer
                </button>
              )}
            </div>
          </div>

          {hasLinkContext && (
            <div className="network-modal-category">
              <div className="network-modal-category-header">
                <h3>Aéroports liés</h3>
                {/* MODIFIÉ : bouton visible uniquement depuis Antananarivo */}
                {isAdmin && onStartLink && canStartLinkFromHere && (
                  <button
                    className="icon-btn icon-btn--sm"
                    title="Créer une nouvelle liaison"
                    onClick={onStartLink}
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {linkedAirports.length === 0 && (
                <p className="network-empty">Aucune liaison pour ce paramètre</p>
              )}

              <div className="network-item-grid-params">
                {linkedAirports.map((linked) => (
                  <div
                    key={linked.linkId}
                    className="network-item-card network-item-card--interactive"
                    onClick={() => onOpenLinkDetail?.(linked.linkId)}
                  >
                    <div className="network-item-card-top">
                      {linkColor && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            display: 'inline-block',
                            background: linkColor,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span className="network-item-title">
                        <strong style={{ color: 'var(--color-primary)' }}>{linked.iata}</strong> — {linked.name}
                      </span>

                      {isAdmin && onDeleteLink && (
                        <button
                          className="icon-btn icon-btn--danger icon-btn--sm"
                          title="Supprimer cette liaison"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLink(linked.linkId);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="network-modal-category">
            <div className="network-modal-category-header">
              <h3>Sous-paramètres / Configuration détaillée</h3>
              {isAdmin && (
                <button className="icon-btn icon-btn--sm" onClick={() => setShowAddSub(!showAddSub)}>
                  <Plus size={14} />
                </button>
              )}
            </div>

            {subParameters.length === 0 && (
              <p className="network-empty">Aucun sous-paramètre configuré</p>
            )}

            <div className="network-item-grid">
              {subParameters.map(sub => (
                <div key={sub.id} className="network-item-card sub-parameter-card">
                  <div className="network-item-card-top">
                    {!hideStatus && <span className={`status-dot status-dot--${sub.status}`} />}
                    <span className="network-item-title">{sub.title}</span>
                    {isAdmin && (
                      <div className="network-card-actions">
                        {!hideStatus && (
                          <button
                            className="btn-text-action"
                            onClick={() => onToggleSubParameterStatus?.(sub.id)}
                            title="Changer statut"
                          >
                            {sub.status === 'operational' ? 'Maintenance' : 'Opérationnel'}
                          </button>
                        )}
                        <button
                          className="icon-btn icon-btn--danger icon-btn--sm"
                          onClick={() => onDeleteSubParameter?.(sub.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="network-sub-val"><strong>Valeur :</strong> {sub.value}</p>
                  {sub.description && <p className="network-item-desc">{sub.description}</p>}
                </div>
              ))}
            </div>

            {showAddSub && (
              <div className="network-add-form-panel">
                <h4>Nouveau sous-paramètre</h4>
                <div className="network-add-form-grid">
                  <input
                    className="form-input"
                    placeholder="Nom (ex: Fréquence)"
                    value={newSubTitle}
                    onChange={e => setNewSubTitle(e.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder="Valeur (ex: 123.450 MHz)"
                    value={newSubValue}
                    onChange={e => setNewSubValue(e.target.value)}
                  />
                </div>
                <div className="network-add-form-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAddSub(false)}>Annuler</button>
                  <button className="btn btn-primary btn-sm" onClick={addSubParameter}>Ajouter</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}