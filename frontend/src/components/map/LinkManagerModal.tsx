// LinkManagerModal.tsx
import { useState } from 'react';
import { X, Unlink } from 'lucide-react';
import { getNetworkLinkColor } from '../../data/networkCategories';
import type { NetworkCategoryKey, NetworkLink } from '../../data/networkCategories';
import type { AirportsMap } from '../../hooks/useAirportsData';
// @ts-ignore
import './NetworkModal.css';

interface LinkManagerModalProps {
  category: NetworkCategoryKey;
  subItem: string;
  mode: 'add' | 'remove';
  airports: AirportsMap;
  links: NetworkLink[];
  // MODIFIÉ : ajout du paramètre `bidirectional` (comportement inchangé si
  // l'appelant ne le fournit pas, cf. valeur par défaut côté hook).
  onAddLink: (
    category: NetworkCategoryKey,
    itemTitle: string,
    from: string,
    to: string,
    bidirectional: boolean
  ) => void;
  onDeleteLink: (linkId: string) => void;
  onClose: () => void;
}

// Type de liaison proposé dans le formulaire d'ajout.
type LinkDirectionType = 'unidirectional' | 'bidirectional';

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
  // NOUVEAU : type de liaison, par défaut "Unidirectionnelle" pour
  // conserver exactement le comportement actuel si l'utilisateur ne
  // touche pas au champ.
  const [linkType, setLinkType] = useState<LinkDirectionType>('unidirectional');

  const matchingLinks = links.filter(
    (l) => l.category === category && l.itemTitle.toLowerCase().includes(subItem.toLowerCase())
  );

  const handleCreate = () => {
    if (!fromKey || !toKey || fromKey === toKey) return;
    onAddLink(category, subItem, fromKey, toKey, linkType === 'bidirectional');
    setFromKey('');
    setToKey('');
    setLinkType('unidirectional');
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

              {/* NOUVEAU : type de liaison */}
              <label>Type de liaison</label>
              <select
                className="form-input"
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as LinkDirectionType)}
              >
                <option value="unidirectional">Unidirectionnelle</option>
                <option value="bidirectional">Bidirectionnelle</option>
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
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            display: 'inline-block',
                            background: getNetworkLinkColor(category, link.itemTitle),
                            flexShrink: 0,
                          }}
                        />
                        <span className="network-item-title">
                          {link.bidirectional ? '⇄ ' : ''}
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