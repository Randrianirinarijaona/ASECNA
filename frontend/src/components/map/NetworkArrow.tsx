// components/map/NetworkArrow.tsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
// @ts-ignore: Missing type definitions for leaflet
import L from 'leaflet';
import 'leaflet-polylinedecorator'; // Nécessite l'installation

interface NetworkArrowProps {
  positions: [number, number][];
  color?: string;
  weight?: number;
  onClick?: () => void;
  // ── nouveau : noms affichés directement sur la flèche ─────────────────
  fromName?: string;
  toName?: string;
}

// Échappement basique pour éviter d'injecter du HTML via un nom d'aéroport
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function NetworkArrow({
  positions,
  color = '#2563eb',
  weight = 5,
  onClick,
  fromName,
  toName,
}: NetworkArrowProps) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;

    // Création de la ligne principale
    const polyline = L.polyline(positions, {
      color,
      weight,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    });

    // Ajout de la flèche au bout de la ligne
    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: '70%',
          repeat: 0,
          symbol: L.Symbol.arrowHead({
            pixelSize: 18,
            polygon: false,
            pathOptions: {
              stroke: true,
              color: color,
              weight: 3,
              opacity: 1,
            },
          }),
        },
      ],
    });

    // Ajout sur la carte
    polyline.addTo(map);
    decorator.addTo(map);

    // ── Étiquette permanente avec le nom des aéroports liés (nouveau) ──
    // Positionnée au milieu du segment, non-interactive (pointer-events: none)
    // pour ne jamais gêner le clic sur la ligne/flèche. Reste visible à tout
    // niveau de zoom, contrairement au simple survol/tooltip natif Leaflet.
    let label: L.Marker | null = null;
    if (fromName && toName) {
      const midLat = (positions[0][0] + positions[positions.length - 1][0]) / 2;
      const midLng = (positions[0][1] + positions[positions.length - 1][1]) / 2;
      const labelText = `${escapeHtml(fromName)} → ${escapeHtml(toName)}`;

      label = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'network-arrow-label-icon',
          html: `<div style="
            background:#ffffff;
            padding:2px 8px;
            border-radius:6px;
            font-size:11px;
            font-weight:600;
            font-family:inherit;
            color:${color};
            border:1px solid ${color};
            white-space:nowrap;
            box-shadow:0 1px 3px rgba(0,0,0,0.35);
            pointer-events:none;
            transform:translate(-50%, -50%);
          ">${labelText}</div>`,
        }),
        interactive: false,
        zIndexOffset: 1000,
      });
      label.addTo(map);
    }

    // Gestion du clic sur la ligne
    if (onClick) {
      polyline.on('click', onClick);
      decorator.on('click', onClick);
    }

    // Nettoyage à la destruction du composant
    return () => {
      map.removeLayer(polyline);
      map.removeLayer(decorator);
      if (label) map.removeLayer(label);
    };
  }, [positions, color, weight, onClick, fromName, toName, map]);

  return null; // Ce composant n'affiche rien directement (tout est géré par Leaflet)
}