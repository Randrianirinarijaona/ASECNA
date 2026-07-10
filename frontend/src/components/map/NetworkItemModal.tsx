//NetworkItemModal.tsx
// Modal de détail pour UN item réseau précis (ex: une fréquence radio).
// Affiche désormais aussi les aéroports liés à cet item (quand le contexte
// airportKey/links/allAirports est fourni) et permet de créer/supprimer des liaisons,
// ainsi que d'ouvrir l'onglet dédié aux paramètres de chaque liaison.

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
  Link2,
} from 'lucide-react';
import { NETWORK_CATEGORY_LABELS } from '../../data/networkCategories';
import type { NetworkCategoryKey, NetworkLink } from '../../data/networkCategories';
import type { AirportsMap } from '../../hooks/useAirportsData';
// TypeScript may complain about side-effect CSS imports when no type declaration is present.
// Suppress the error for this import.
// @ts-ignore
import './NetworkItemModal.css';

interface NetworkSubParameter {
  id: string;
  title: string;
  value: string;
  status: 'operational' | 'maintenance';
  description?: string;
}

interface NetworkItemModalProps {
  itemTitle: string;
  itemStatus: 'operational' | 'maintenance';
  itemDescription?: string;
  airportName: string;
  isAdmin: boolean;
  onClose: () => void;
  onUpdateItem?: (
    newTitle: string,
    newStatus: 'operational' | 'maintenance',
    newDesc?: string
  ) => void;

  // ── Contexte optionnel pour la gestion des liaisons ──────────────────
  // Fourni uniquement quand ce modal est ouvert depuis un aéroport précis
  // (via NetworkModal). Quand ce modal est ouvert depuis un clic sur une
  // flèche de connexion (plusieurs aéroports concernés), ces props restent
  // undefined et la section "Aéroports liés" ne s'affiche pas.
  category?: NetworkCategoryKey;
  airportKey?: string;
  links?: NetworkLink[];
  allAirports?: AirportsMap;
  onStartLink?: () => void;
  onDeleteLink?: (linkId: string) => void;
  onNavigateToAirport?: (key: string) => void;
  // nouveau : ouvre l'onglet dédié aux paramètres d'une liaison précise
  onOpenLinkDetail?: (linkId: string) => void;
}

export default function NetworkItemModal({
  itemTitle,
  itemStatus,
  itemDescription,
  airportName,
  isAdmin,
  onClose,
  onUpdateItem,
  category,
  airportKey,
  links,
  allAirports,
  onStartLink,
  onDeleteLink,
  onNavigateToAirport,
  onOpenLinkDetail,
}: NetworkItemModalProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(itemTitle);
  const [editStatus, setEditStatus] = useState(itemStatus);
  const [editDesc, setEditDesc] = useState(itemDescription || '');

  const [subParameters, setSubParameters] = useState<NetworkSubParameter[]>([
    {
      id: '1',
      title: 'Fréquence principale',
      value: '123.450 MHz',
      status: 'operational',
      description: 'Voie principale de communication',
    },
    {
      id: '2',
      title: 'Fréquence Backup',
      value: '121.950 MHz',
      status: 'maintenance',
      description: 'Fréquence de secours',
    },
    {
      id: '3',
      title: 'Protocole utilisé',
      value: 'AIDC v2.1',
      status: 'operational',
    },
  ]);

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
    setSubParameters(prev => [...prev, {
      id: Date.now().toString(),
      title: newSubTitle.trim(),
      value: newSubValue.trim(),
      status: 'operational',
    }]);
    setNewSubTitle('');
    setNewSubValue('');
    setShowAddSub(false);
  };

  const deleteSubParameter = (id: string) => {
    setSubParameters(prev => prev.filter(p => p.id !== id));
  };

  const toggleSubStatus = (id: string) => {
    setSubParameters(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: p.status === 'operational' ? 'maintenance' : 'operational' }
          : p
      )
    );
  };

  // ── Calcul des aéroports liés à cet item, pour l'aéroport courant ────
  // Ne fait rien (tableau vide) si le contexte nécessaire n'est pas fourni.
  const hasLinkContext = Boolean(category && airportKey && links && allAirports);

  const linkedAirports = hasLinkContext
    ? links!
        .filter(
          (l) =>
            l.category === category &&
            l.itemTitle === itemTitle &&
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
                  className="icon-btn"
                  title="Modifier"
                  onClick={() => setEditing(!editing)}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className={`icon-btn ${editStatus === 'operational' ? 'status-operational' : 'status-maintenance'}`}
                  title="Changer statut global"
                  onClick={toggleGlobalStatus}
                >
                  {editStatus === 'operational' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
              </>
            )}
            <button className="icon-btn" title="Fermer" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="network-modal-body">
          <div className="network-item-detail">
            <div className="network-item-card-top">
              <span className={`status-dot status-dot--${editStatus}`} />
              {editing ? (
                <input
                  className="form-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
              ) : (
                <span className="network-item-title">{itemTitle}</span>
              )}
            </div>

            {editing ? (
              <textarea
                className="form-input"
                placeholder="Description du paramètre"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={3}
              />
            ) : (
              itemDescription && <p className="network-item-desc">{itemDescription}</p>
            )}

            <span className={`status-label status-label--${editStatus}`}>
              {editStatus === 'maintenance' ? (
                <>
                  <AlertTriangle size={12} /> En Maintenance
                </>
              ) : (
                <>
                  <ShieldCheck size={12} /> Opérationnel
                </>
              )}
            </span>

            {editing && (
              <button className="btn btn-primary btn-sm" onClick={handleSaveItem}>
                Enregistrer les modifications
              </button>
            )}
          </div>

          {/* ── Aéroports liés ──────────────────────────────────────────
              Affiché seulement si le contexte de liaison a été fourni
              (ouverture depuis un aéroport précis via NetworkModal) */}
          {hasLinkContext && (
            <div className="network-modal-category">
              <div className="network-modal-category-header">
                <h3>Aéroports liés</h3>
                {isAdmin && onStartLink && (
                  <button
                    className="icon-btn"
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
                    className="network-item-card"
                    style={{ cursor: onNavigateToAirport ? 'pointer' : 'default' }}
                    onClick={() => onNavigateToAirport?.(linked.key)}
                  >
                    <div className="network-item-card-top">
                      <span className="network-item-title">
                        {linked.iata} — {linked.name}
                      </span>

                      {/* nouveau : ouvre l'onglet dédié aux paramètres de cette liaison */}
                      {onOpenLinkDetail && (
                        <button
                          className="icon-btn icon-btn--sm"
                          title="Voir les paramètres de cette liaison"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLinkDetail(linked.linkId);
                          }}
                        >
                          <Link2 size={13} />
                        </button>
                      )}

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

          {/* Sous-paramètres : section inchangée */}
          <div className="network-modal-category">
            <div className="network-modal-category-header">
              <h3>Sous-paramètres / Configuration détaillée</h3>
              {isAdmin && (
                <button className="icon-btn" onClick={() => setShowAddSub(!showAddSub)}>
                  <Plus size={14} />
                </button>
              )}
            </div>

            <div className="network-item-grid">
              {subParameters.map(sub => (
                <div key={sub.id} className="network-item-card sub-parameter-card">
                  <div className="network-item-card-top">
                    <span className={`status-dot status-dot--${sub.status}`} />
                    <span className="network-item-title">{sub.title}</span>
                    {isAdmin && (
                      <>
                        <button
                          className="icon-btn icon-btn--sm"
                          onClick={() => toggleSubStatus(sub.id)}
                          title="Changer statut"
                        >
                          {sub.status === 'operational' ? 'M' : 'O'}
                        </button>
                        <button
                          className="icon-btn icon-btn--danger icon-btn--sm"
                          onClick={() => deleteSubParameter(sub.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="network-item-desc"><strong>Valeur :</strong> {sub.value}</p>
                  {sub.description && <p className="network-item-desc">{sub.description}</p>}
                </div>
              ))}
            </div>

            {showAddSub && (
              <div className="network-add-form">
                <input
                  className="form-input"
                  placeholder="Nom du sous-paramètre"
                  value={newSubTitle}
                  onChange={e => setNewSubTitle(e.target.value)}
                />
                <input
                  className="form-input"
                  placeholder="Valeur (ex: 123.450 MHz)"
                  value={newSubValue}
                  onChange={e => setNewSubValue(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" onClick={addSubParameter}>
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