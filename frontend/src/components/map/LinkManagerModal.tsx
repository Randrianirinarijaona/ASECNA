// LinkManagerModal.tsx
import { useState } from 'react';
import { X, Unlink } from 'lucide-react';
import {
  getNetworkLinkColor,
  ANTANANARIVO_AIRPORT_KEY,
  LINK_DIRECTION_LABELS,
  LINK_DIRECTION_GLYPH,
  LINK_STATUS_COLORS,
  LINK_STATUS_LABELS,
} from '../../data/networkCategories';
import type { NetworkCategoryKey, NetworkLink, LinkDirection } from '../../data/networkCategories';
import type { AirportsMap } from '../../hooks/useAirportsData';
// @ts-ignore
import './NetworkModal.css';

interface LinkManagerModalProps {
  category: NetworkCategoryKey;
  subItem: string;
  mode: 'add' | 'remove';
  airports: AirportsMap;
  links: NetworkLink[];
  // MODIFIÉ : le paramètre `bidirectional` est remplacé par un objet de
  // détails regroupant direction + type/circuit optionnels + IP/port
  // obligatoires (cf. consigne "ajout de liaison — nouvelles propriétés").
  onAddLink: (
    category: NetworkCategoryKey,
    itemTitle: string,
    from: string,
    to: string,
    details: {
      direction: LinkDirection;
      linkType?: string;
      circuit?: string;
      ipAddress: string;
      port: string;
    }
  ) => void;
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
  // NOUVEAU : le point de départ est désormais figé sur Antananarivo — plus
  // aucun choix possible dans le formulaire (cf. consigne "Tous les points
  // de départ doivent obligatoirement être sur Antananarivo").
  const antananarivoAirport = airports[ANTANANARIVO_AIRPORT_KEY];
  const airportEntries = Object.entries(airports).filter(([key]) => key !== ANTANANARIVO_AIRPORT_KEY);

  const [toKey, setToKey] = useState('');
  const [direction, setDirection] = useState<LinkDirection>('sortant');
  const [linkType, setLinkType] = useState('');
  const [circuit, setCircuit] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('');

  const matchingLinks = links.filter(
    (l) => l.category === category && l.itemTitle.toLowerCase().includes(subItem.toLowerCase())
  );

  const canSubmit = Boolean(antananarivoAirport) && Boolean(toKey) && Boolean(ipAddress.trim()) && Boolean(port.trim());

  const handleCreate = () => {
    if (!antananarivoAirport || !toKey || !ipAddress.trim() || !port.trim()) return;
    onAddLink(category, subItem, ANTANANARIVO_AIRPORT_KEY, toKey, {
      direction,
      linkType: linkType.trim() || undefined,
      circuit: circuit.trim() || undefined,
      ipAddress: ipAddress.trim(),
      port: port.trim(),
    });
    setToKey('');
    setDirection('sortant');
    setLinkType('');
    setCircuit('');
    setIpAddress('');
    setPort('');
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
            !antananarivoAirport ? (
              <p className="network-empty">
                Antananarivo (Ivato) est introuvable : impossible de créer une liaison sans point de départ.
              </p>
            ) : (
              <div className="network-add-form" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <label>Aéroport de départ</label>
                {/* MODIFIÉ : champ figé (lecture seule), toujours Antananarivo. */}
                <input
                  className="form-input"
                  value={
                    antananarivoAirport.iata
                      ? `${antananarivoAirport.iata} — ${antananarivoAirport.name}`
                      : antananarivoAirport.name
                  }
                  disabled
                  readOnly
                />

                <label>Aéroport d'arrivée</label>
                <select className="form-input" value={toKey} onChange={(e) => setToKey(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {airportEntries.map(([key, a]) => (
                    <option key={key} value={key}>
                      {a.iata ? `${a.iata} — ${a.name}` : a.name}
                    </option>
                  ))}
                </select>

                {/* MODIFIÉ : remplace le sélecteur "Unidirectionnelle / Bidirectionnelle" */}
                <label>Direction</label>
                <select
                  className="form-input"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as LinkDirection)}
                >
                  <option value="sortant">{LINK_DIRECTION_LABELS.sortant}</option>
                  <option value="entrant">{LINK_DIRECTION_LABELS.entrant}</option>
                  <option value="entrant_sortant">{LINK_DIRECTION_LABELS.entrant_sortant}</option>
                </select>

                {/* NOUVEAU */}
                <label>Type (optionnel)</label>
                <input
                  className="form-input"
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value)}
                  placeholder="ex: Fibre optique"
                />

                <label>Circuit (optionnel)</label>
                <input
                  className="form-input"
                  value={circuit}
                  onChange={(e) => setCircuit(e.target.value)}
                  placeholder="ex: CKT-042"
                />

                <label>@IP</label>
                <input
                  className="form-input"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="ex: 10.2.0.5"
                  required
                />

                <label>Port</label>
                <input
                  className="form-input"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="ex: 8080"
                  required
                />

                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12 }}
                  disabled={!canSubmit}
                  onClick={handleCreate}
                >
                  Créer la liaison
                </button>
              </div>
            )
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
                        {/* NOUVEAU : petit indicateur de statut */}
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            display: 'inline-block',
                            background: LINK_STATUS_COLORS[link.status],
                            flexShrink: 0,
                          }}
                          title={LINK_STATUS_LABELS[link.status]}
                        />
                        <span className="network-item-title">
                          {(from?.iata || from?.name) ?? '—'} {LINK_DIRECTION_GLYPH[link.direction]}{' '}
                          {(to?.iata || to?.name) ?? '—'}
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