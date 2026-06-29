import { useState } from 'react';
import { X } from 'lucide-react';
import type { Airport } from '../../types';
import './AddAirportModal.css';

interface AddAirportModalProps {
  onClose: () => void;
  onSubmit: (key: string, airport: Airport) => void;
}

export default function AddAirportModal({ onClose, onSubmit }: AddAirportModalProps) {
  const [name, setName] = useState('');
  const [iata, setIata] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !iata.trim() || !lat || !lng) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setError('Latitude / longitude invalides');
      return;
    }

    const key = iata.trim().toUpperCase();
    onSubmit(key, {
      name: name.trim(),
      iata: key,
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
            Code IATA
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