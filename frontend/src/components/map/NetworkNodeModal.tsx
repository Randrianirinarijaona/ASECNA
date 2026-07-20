// NetworkNodeModal.tsx
// Gère les "points techniques" de la section Réseaux (relais VHF/HF, antennes
// SRNA...) créés depuis les boutons "Ajouter/Supprimer un réseau" de la
// sidebar, pour un sous-réseau donné.
// mode 'add'    -> formulaire nom + coordonnées
// mode 'remove' -> liste des points techniques existants, avec suppression
//
// Note : la création de points techniques génériques depuis "Réseau local"
// utilise désormais un flux différent (clic sur la carte, cf. MapPage +
// TechnicalPointDetailModal) ; ce composant ne gère donc plus que le cas où
// category/subItem sont fournis par le parent.

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { NETWORK_CATEGORY_LABELS } from '../../data/networkCategories';
import type { NetworkCategoryKey } from '../../data/networkCategories';
import type { AirportsMap } from '../../hooks/useAirportsData';
// @ts-ignore
import './NetworkModal.css';

interface NetworkNodeModalProps {
  category: NetworkCategoryKey;
  subItem: string;
  mode: 'add' | 'remove';
  airports: AirportsMap; // idéalement déjà filtré aux points techniques par le parent
  onCreate: (category: NetworkCategoryKey, subItem: string, name: string, coords: [number, number]) => void;
  onDelete: (key: string) => void;
  onClose: () => void;
}

export default function NetworkNodeModal({
  category,
  subItem,
  mode,
  airports,
  onCreate,
  onDelete,
  onClose,
}: NetworkNodeModalProps) {
  const [name, setName] = useState('');

  // Coordonnées saisies directement ici, avec le centre de Madagascar comme
  // valeur par défaut (cf. MapPage).
  const [lat, setLat] = useState('-18.9');
  const [lng, setLng] = useState('46.8');

  const matchingNodes = Object.entries(airports).filter(
    ([, a]) =>
      a.isTechnicalPoint &&
      (a.sections[category] || []).some((i) => i.title.toLowerCase() === subItem.toLowerCase())
  );

  const handleCreate = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!name.trim() || Number.isNaN(latNum) || Number.isNaN(lngNum)) return;
    onCreate(category, subItem, name.trim(), [latNum, lngNum]);
    setName('');
  };

  return (
    <div className="network-modal-overlay">
      <div className="network-modal" style={{ maxWidth: 480 }}>
        <div className="network-modal-header">
          <div>
            <h2>{mode === 'add' ? 'Ajouter un réseau' : 'Supprimer un réseau'}</h2>
            <p className="network-modal-subtitle">
              {NETWORK_CATEGORY_LABELS[category]} • {subItem}
            </p>
          </div>
          <button className="icon-btn" title="Fermer" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="network-modal-body">
          {mode === 'add' ? (
            <div className="network-add-form" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label>Nom de l'endroit</label>
              <input
                className="form-input"
                placeholder="ex: Relais VHF Antsirabe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />

              <label>Latitude</label>
              <input className="form-input" value={lat} onChange={(e) => setLat(e.target.value)} />

              <label>Longitude</label>
              <input className="form-input" value={lng} onChange={(e) => setLng(e.target.value)} />

              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                disabled={!name.trim()}
                onClick={handleCreate}
              >
                Créer le point
              </button>
            </div>
          ) : (
            <>
              {matchingNodes.length === 0 && (
                <p className="network-empty">Aucun point technique à supprimer pour ce sous-réseau</p>
              )}
              <div className="network-item-grid">
                {matchingNodes.map(([key, a]) => (
                  <div key={key} className="network-item-card">
                    <div className="network-item-card-top">
                      <span className="network-item-title">{a.name}</span>
                      <button
                        className="icon-btn icon-btn--danger icon-btn--sm"
                        title="Supprimer ce point"
                        onClick={() => onDelete(key)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}