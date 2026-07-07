// LinkManagerModal.tsx
// Ouvert depuis la Sidebar (catégorie SFA) pour créer ou supprimer des
// liaisons sans passer par le clic sur la carte.
// mode 'add'    -> formulaire départ/arrivée
// mode 'remove' -> liste des liaisons existantes pour ce sous-réseau

import { useState } from 'react';
import { X, Unlink } from 'lucide-react';
import type { NetworkCategoryKey, NetworkLink } from '../../data/networkCategories';
import type { AirportsMap } from '../../hooks/useAirportsData';
// @ts-ignore
import './NetworkModal.css'; // réutilise les styles existants (overlay, form-input, btn...)

interface LinkManagerModalProps {
  category: NetworkCategoryKey;
  subItem: string;
  mode: 'add' | 'remove';
  airports: AirportsMap;
  links: NetworkLink[];
  onAddLink: (category: NetworkCategoryKey, itemTitle: string, from: string, to: string) => void;
  onDeleteLink: (linkId: string) => void;
  onClose: () => void;
}

export default function LinkManagerModal({
  category,
  subItem,
  mode,
  airports,
  links,
  onAddLink,
  onDeleteLink,
  onClose,
}: LinkManagerModalProps) {
  const airportEntries = Object.entries(airports);

  const [fromKey, setFromKey] = useState('');
  const [toKey, setToKey] = useState('');

  // Liaisons existantes pour ce sous-réseau (comparaison "includes" comme
  // ailleurs dans le projet : le titre réel peut être plus précis, ex.
  // "AMHS/RSFTA" pour le sous-réseau générique "AMHS")
  const matchingLinks = links.filter(
    (l) => l.category === category && l.itemTitle.toLowerCase().includes(subItem.toLowerCase())
  );

  const handleCreate = () => {
    if (!fromKey || !toKey || fromKey === toKey) return;
    onAddLink(category, subItem, fromKey, toKey);
    setFromKey('');
    setToKey('');
  };

  return (
    <div className="network-modal-overlay">
      <div className="network-modal" style={{ maxWidth: 480 }}>
        <div className="network-modal-header">
          <div>
            <h2>{mode === 'add' ? 'Ajouter une liaison' : 'Supprimer une liaison'}</h2>
            <p className="network-modal-subtitle">{subItem}</p>
          </div>
          <button className="icon-btn" title="Fermer" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="network-modal-body">
          {mode === 'add' ? (
            <div className="network-add-form" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label>Aéroport de départ</label>
              <select className="form-input" value={fromKey} onChange={(e) => setFromKey(e.target.value)}>
                <option value="">— Choisir —</option>
                {airportEntries.map(([key, a]) => (
                  <option key={key} value={key}>
                    {a.iata ? `${a.iata} — ${a.name}` : a.name}
                  </option>
                ))}
              </select>

              <label>Aéroport d'arrivée</label>
              <select className="form-input" value={toKey} onChange={(e) => setToKey(e.target.value)}>
                <option value="">— Choisir —</option>
                {airportEntries
                  .filter(([key]) => key !== fromKey)
                  .map(([key, a]) => (
                    <option key={key} value={key}>
                      {a.iata ? `${a.iata} — ${a.name}` : a.name}
                    </option>
                  ))}
              </select>

              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                disabled={!fromKey || !toKey || fromKey === toKey}
                onClick={handleCreate}
              >
                Créer la liaison
              </button>
            </div>
          ) : (
            <>
              {matchingLinks.length === 0 && (
                <p className="network-empty">Aucune liaison à supprimer pour ce sous-réseau</p>
              )}
              <div className="network-item-grid">
                {matchingLinks.map((link) => {
                  const from = airports[link.fromAirportKey];
                  const to = airports[link.toAirportKey];
                  return (
                    <div key={link.id} className="network-item-card">
                      <div className="network-item-card-top">
                        <span className="network-item-title">
                          {(from?.iata || from?.name) ?? '—'} → {(to?.iata || to?.name) ?? '—'}
                        </span>
                        <button
                          className="icon-btn icon-btn--danger icon-btn--sm"
                          title="Supprimer cette liaison"
                          onClick={() => onDeleteLink(link.id)}
                        >
                          <Unlink size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}