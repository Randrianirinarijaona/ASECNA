import { Marker, Tooltip } from 'react-leaflet';
// @ts-ignore: Missing type definitions for leaflet
import L from 'leaflet';
import type { Airport } from '../../types';
// @ts-ignore: CSS module side-effect import without type declarations
import './AirportMarker.css';

interface Props {
  airport: Airport;
  onClick: () => void;
  isSelected?: boolean;
}

// Icône construite en HTML/CSS pur (pas d'image externe) : évite tout
// problème de résolution d'assets Leaflet sous Vite, et permet d'appliquer
// directement les classes définies dans AirportMarker.css.
function buildAirportIcon(isSelected: boolean) {
  return L.divIcon({
    className: 'airport-marker-icon',
    html: `<span class="airport-marker${isSelected ? ' selected' : ''}"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function AirportMarker({ airport, onClick, isSelected }: Props) {
  return (
    <Marker
      position={airport.coords}
      icon={buildAirportIcon(Boolean(isSelected))}
      eventHandlers={{ click: onClick }}
    >
      <Tooltip direction="top" offset={[0, -16]} opacity={1} className="marker-tooltip">
        {airport.name}
      </Tooltip>
    </Marker>
  );
}