import { useState } from 'react';
import { X } from 'lucide-react';
import type { Airport } from '../../types';
// @ts-ignore
import './AddAirportModal.css';

interface AddAirportModalProps {
  existingKeys: string[];
  onClose: () => void;
  onSubmit: (key: string, airport: Airport) => void;
}

// NOUVEAU : dérive une clé lisible à partir du nom quand aucun code IATA
// n'est fourni (majuscules, sans accents, espaces -> tirets).
function slugifyName(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

export default function AddAirportModal({ existingKeys, onClose, onSubmit }: AddAirportModalProps) {
  const [name, setName] = useState('');
  const [iata, setIata] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // MODIFIÉ : le code IATA n'est plus obligatoire (seuls nom, latitude
    // et longitude le restent).
    if (!name.trim() || !lat || !lng) {
      setError('Le nom, la latitude et la longitude sont obligatoires');
      return;
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setError('Latitude / longitude invalides');
      return;
    }

    const trimmedIata = iata.trim();

    if (trimmedIata) {
      // Comportement STRICTEMENT inchangé : la clé est le code IATA saisi.
      const key = trimmedIata.toUpperCase();
      if (existingKeys.includes(key)) {
        setError(`Le code IATA "${key}" est déjà utilisé par un autre aéroport`);
        return;
      }
      onSubmit(key, {
        name: name.trim(),
        iata: key,
        coords: [latNum, lngNum],
        sections: { sfa: [], sma: [], srna: [] },
      } as Airport);
      onClose();
      return;
    }

    // NOUVEAU : pas de code IATA -> la clé est dérivée automatiquement du
    // nom, en garantissant son unicité (aucune saisie supplémentaire
    // requise de la part de l'utilisateur).
    const baseKey = slugifyName(name) || `AEROPORT-${Date.now()}`;
    let key = baseKey;
    let suffix = 2;
    while (existingKeys.includes(key)) {
      key = `${baseKey}-${suffix}`;
      suffix += 1;
    }

    onSubmit(key, {
      name: name.trim(),
      iata: '',
      coords: [latNum, lngNum],
      sections: { sfa: [], sma: [], srna: [] },
    } as Airport);
    onClose();
  };

  return (
    <div className="add-airport-overlay" onClick={onClose}>
      <div className="add-airport-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-airport-header">
          <h2>Nouvel aéroport</h2>
          <button className="add-airport-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="add-airport-form">
          <label>
            Nom
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ivato"
            />
          </label>
          <label>
            {/* MODIFIÉ : indication "(optionnel)" */}
            Code IATA (optionnel)
            <input
              className="form-input"
              value={iata}
              onChange={(e) => setIata(e.target.value)}
              placeholder="TNR"
              maxLength={3}
            />
          </label>
          <div className="add-airport-coords">
            <label>
              Latitude
              <input
                className="form-input"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="-18.8787"
              />
            </label>
            <label>
              Longitude
              <input
                className="form-input"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="47.5079"
              />
            </label>
          </div>
          {error && <p className="add-airport-error">{error}</p>}
          <button className="btn btn-primary" onClick={handleSubmit}>
            Créer l'aéroport
          </button>
        </div>
      </div>
    </div>
  );
}