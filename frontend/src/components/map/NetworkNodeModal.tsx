// NetworkNodeModal.tsx
// Gère les "points techniques" (relais VHF/HF, antennes SRNA...) : des
// points sur la carte qui ne sont pas de vrais aéroports (Airport.isTechnicalPoint).
// mode 'add'    -> formulaire nom + coordonnées
// mode 'remove' -> liste des points techniques existants, avec suppression

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { NETWORK_CATEGORY_LABELS, NETWORK_SUBITEMS } from '../../data/networkCategories';
import type { NetworkCategoryKey } from '../../data/networkCategories';
import type { AirportsMap } from '../../hooks/useAirportsData';
// @ts-ignore
import './NetworkModal.css';

interface NetworkNodeModalProps {
  category?: NetworkCategoryKey; // preset si ouvert depuis la section "Réseaux"
  subItem?: string;
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

  // ⚠️ Il n'existe pas encore de flux "clic sur la carte" réutilisable comme
  // pour les liaisons — les coordonnées sont saisies directement ici, avec
  // le centre de Madagascar comme valeur par défaut (cf. MapPage). Si tu as
  // un composant de sélection de position sur la carte, remplace ces deux
  // champs par ce composant.
  const [lat, setLat] = useState('-18.9');
  const [lng, setLng] = useState('46.8');

  // Si category/subItem non fournis (ouverture générique depuis "Réseau local"),
  // l'utilisateur les choisit lui-même via ces selects
  const [selectedCategory, setSelectedCategory] = useState<NetworkCategoryKey>(category ?? 'sma');
  const [selectedSubItem, setSelectedSubItem] = useState<string>(
    subItem ?? NETWORK_SUBITEMS[category ?? 'sma'][0]
  );

  const effectiveCategory = category ?? selectedCategory;
  const effectiveSubItem = subItem ?? selectedSubItem;

  const matchingNodes = Object.entries(airports).filter(
    ([, a]) =>
      a.isTechnicalPoint &&
      (a.sections[effectiveCategory] || []).some(
        (i) => i.title.toLowerCase() === effectiveSubItem.toLowerCase()
      )
  );

  const handleCreate = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!name.trim() || Number.isNaN(latNum) || Number.isNaN(lngNum)) return;
    onCreate(effectiveCategory, effectiveSubItem, name.trim(), [latNum, lngNum]);
    setName('');
  };

  return (
    <div className="network-modal-overlay">
      <div className="network-modal" style={{ maxWidth: 480 }}>
        <div className="network-modal-header">
          <div>
            <h2>{mode === 'add' ? 'Ajouter un réseau' : 'Supprimer un réseau'}</h2>
            <p className="network-modal-subtitle">{subItem ?? 'Choisir un sous-réseau'}</p>
          </div>
          <button className="icon-btn" title="Fermer" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="network-modal-body">
          {/* Sélecteurs catégorie/sous-réseau, affichés seulement si non pré-définis par le parent */}
          {!category && (
            <div className="network-add-form" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label>Catégorie</label>
              <select
                className="form-input"
                value={selectedCategory}
                onChange={(e) => {
                  const c = e.target.value as NetworkCategoryKey;
                  setSelectedCategory(c);
                  setSelectedSubItem(NETWORK_SUBITEMS[c][0]);
                }}
              >
                {(Object.keys(NETWORK_SUBITEMS) as NetworkCategoryKey[]).map((c) => (
                  <option key={c} value={c}>
                    {NETWORK_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>

              <label>Sous-réseau</label>
              <select
                className="form-input"
                value={selectedSubItem}
                onChange={(e) => setSelectedSubItem(e.target.value)}
              >
                {NETWORK_SUBITEMS[selectedCategory].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

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