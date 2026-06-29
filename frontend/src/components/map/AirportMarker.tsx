import { Marker } from 'react-leaflet';
import type { Airport } from '../../types';
// @ts-ignore: CSS module side-effect import without type declarations
import './AirportMarker.css';

interface Props {
  airport: Airport;
  onClick: () => void;
  isSelected?: boolean;
}

export default function AirportMarker({ airport, onClick, isSelected }: Props) {
  return (
    <Marker
      position={airport.coords}
      eventHandlers={{ click: onClick }}
      // Permet d'appliquer un style différent au marqueur sélectionné
      // si tu définis .airport-marker--selected dans AirportMarker.css
      // via une icon personnalisée plus tard si besoin.
      opacity={isSelected ? 1 : 0.9}
    />
  );
}