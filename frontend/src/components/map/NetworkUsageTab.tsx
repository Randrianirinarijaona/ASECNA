import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Airport } from '../../types';
import { NETWORK_CATEGORY_LABELS } from '../../data/networkCategories';
import type { NetworkCategoryKey, AirportNetworkMatch } from '../../data/networkCategories';
import './NetworkUsageTab.css';

interface NetworkUsageTabProps {
  category: NetworkCategoryKey;
  subItem: string;
  matches: AirportNetworkMatch[];
  allAirports: Record<string, Airport>;
  isAdmin: boolean;
  onClose: () => void;
  onSelectAirport: (key: string) => void;
  onRemoveAirport: (airportKey: string, matchedTitle: string) => void;
  onAddAirport: (airportKey: string) => void;
}

export default function NetworkUsageTab({
  category,
  subItem,
  matches,
  allAirports,
  isAdmin,
  onClose,
  onSelectAirport,
  onRemoveAirport,
  onAddAirport,
}: NetworkUsageTabProps) {
  const [showAddPicker, setShowAddPicker] = useState(false);

  const matchedKeys = new Set(matches.map((m) => m.key));
  const availableToAdd = Object.entries(allAirports).filter(([key]) => !matchedKeys.has(key));

  return (
    <div className="network-usage-tab">
      <div className="network-usage-header">
        <div>
          <span className="network-usage-category">{NETWORK_CATEGORY_LABELS[category]}</span>
          <h3>{subItem}</h3>
          <p className="network-usage-count">{matches.length} aéroport(s) utilisent ce réseau</p>
        </div>
        <div className="network-usage-actions">
          {isAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddPicker((v) => !v)}>
              <Plus size={14} /> Associer un aéroport
            </button>
          )}
          <button className="icon-btn" onClick={onClose} title="Fermer">
            <X size={18} />
          </button>
        </div>
      </div>

      {showAddPicker && (
        <div className="network-usage-add-picker">
          {availableToAdd.length === 0 && <p>Tous les aéroports utilisent déjà ce réseau.</p>}
          {availableToAdd.map(([key, airport]) => (
            <button
              key={key}
              className="network-usage-add-option"
              onClick={() => {
                onAddAirport(key);
                setShowAddPicker(false);
              }}
            >
              {airport.name} ({airport.iata})
            </button>
          ))}
        </div>
      )}

      <div className="network-usage-list">
        {matches.length === 0 && (
          <p className="network-empty">Aucun aéroport ne référence ce réseau pour le moment.</p>
        )}
        {matches.map(({ key, airport, matchedTitle, status }) => (
          <div key={key} className="network-usage-item">
            <button className="network-usage-item-main" onClick={() => onSelectAirport(key)}>
              <span className={`status-dot status-dot--${status || 'operational'}`} />
              <span className="network-usage-item-name">
                {airport.name} ({airport.iata})
              </span>
              <span className="network-usage-item-matched">{matchedTitle}</span>
            </button>
            {isAdmin && (
              
              <button
                className="icon-btn icon-btn--danger icon-btn--sm"
                title="Retirer cet aéroport"
                onClick={() => onRemoveAirport(key, matchedTitle)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}