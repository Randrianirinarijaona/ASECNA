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
import { ConfirmModal } from '../ui/Modal';
// @ts-ignore
import './NetworkModal.css';

interface LinkManagerModalProps {
  category: NetworkCategoryKey;
  subItem: string;
  mode: 'add' | 'remove';
  airports: AirportsMap;
  links: NetworkLink[];
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
  const antananarivoAirport = airports[ANTANANARIVO_AIRPORT_KEY];
  const airportEntries = Object.entries(airports).filter(([key]) => key !== ANTANANARIVO_AIRPORT_KEY);

  const [toKey, setToKey] = useState('');
  const [direction, setDirection] = useState<LinkDirection>('outgoing');
  const [linkType, setLinkType] = useState('');
  const [circuit, setCircuit] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('');

  // NOUVEAU : liaison en attente de confirmation de suppression
  // (`label` = intitulé lisible, ex. "TNR → DIE").
  const [linkToDelete, setLinkToDelete] = useState<{ id: string; label: string } | null>(null);

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
    setDirection('outgoing');
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
            <h2>{mode === 'add' ? 'Add Link' : 'Delete Link'}</h2>
            <p className="network-modal-subtitle">{subItem}</p>
          </div>
          <button className="icon-btn" title="Fermer" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="network-modal-body network-modal-body--scroll">
          {mode === 'add' ? (
            !antananarivoAirport ? (
              <p className="network-empty">
                Antananarivo (Ivato) est introuvable : impossible de créer une liaison sans point de départ.
              </p>
            ) : (
              <div className="network-add-form" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <label>Departure Airport</label>
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

                <label>Arrival Airport</label>
                <select className="form-input" value={toKey} onChange={(e) => setToKey(e.target.value)}>
                  <option value="">— Select —</option>
                  {airportEntries.map(([key, a]) => (
                    <option key={key} value={key}>
                      {a.iata ? `${a.iata} — ${a.name}` : a.name}
                    </option>
                  ))}
                </select>

                <label>Direction</label>
                <select
                  className="form-input"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as LinkDirection)}
                >
                  <option value="outgoing">{LINK_DIRECTION_LABELS.outgoing}</option>
                  <option value="incoming">{LINK_DIRECTION_LABELS.incoming}</option>
                  <option value="both">{LINK_DIRECTION_LABELS.both}</option>
                </select>

                <label>Type (Optional)</label>
                <input
                  className="form-input"
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value)}
                  placeholder="ex: Fibre optique"
                />

                <label>Circuit (Optional)</label>
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
                  Create Link
                </button>
              </div>
            )
          ) : (
            <>
              {matchingLinks.length === 0 && (
                <p className="network-empty">No link deleted</p>
              )}
              <div className="network-item-grid">
                {matchingLinks.map((link) => {
                  const from = airports[link.fromAirportKey];
                  const to = airports[link.toAirportKey];
                  const linkLabel = `${(from?.iata || from?.name) ?? '—'} ${LINK_DIRECTION_GLYPH[link.direction]} ${(to?.iata || to?.name) ?? '—'}`;
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
                        <span className="network-item-title">{linkLabel}</span>
                        <button
                          className="icon-btn icon-btn--danger icon-btn--sm"
                          title="Delete this Link"
                          // MODIFIÉ : demande de confirmation au lieu d'une
                          // suppression immédiate.
                          onClick={() => setLinkToDelete({ id: link.id, label: linkLabel })}
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

        {/* NOUVEAU : confirmation avant suppression d'une liaison */}
        <ConfirmModal
          isOpen={Boolean(linkToDelete)}
          onClose={() => setLinkToDelete(null)}
          onConfirm={() => {
            if (linkToDelete) onDeleteLink(linkToDelete.id);
            setLinkToDelete(null);
          }}
          title="Delete link"
          message={`Do you delete this link « ${subItem} » ${linkToDelete?.label ?? ''} ?  this parameters will also be deleted. This action is irreversible.`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
        />
      </div>
    </div>
  );
}