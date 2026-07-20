// components/map/NetworkArrow.tsx
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
// @ts-ignore: Missing type definitions for leaflet
import L from 'leaflet';
import 'leaflet-polylinedecorator'; // Nécessite l'installation

interface NetworkArrowProps {
  positions: [number, number][];
  color?: string;
  weight?: number;
  onClick?: () => void;
  // ── noms affichés sur la flèche, uniquement quand une extrémité sort de l'écran ──
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
  // Réf conservée pour permettre un cleanup propre des listeners attachés
  // conditionnellement (seulement si fromName/toName sont fournis).
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (positions.length < 2) return;

    const start = L.latLng(positions[0]);
    const end = L.latLng(positions[positions.length - 1]);

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

    // ── Étiquette conditionnelle avec le nom des aéroports liés ────────
    // Comportement demandé : masquée quand les DEUX extrémités sont visibles
    // à l'écran, affichée automatiquement dès qu'une (ou les deux) sort de
    // la zone visible. Non-interactive (pointer-events: none) pour ne
    // jamais gêner le clic sur la ligne/flèche. Positionnée légèrement
    // au-dessus du milieu du segment pour limiter le chevauchement avec la
    // ligne et la flèche elle-même.
    let label: L.Marker | null = null;

    if (fromName && toName) {
      const midLat = (start.lat + end.lat) / 2;
      const midLng = (start.lng + end.lng) / 2;
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
            transform:translate(-50%, -160%);
          ">${labelText}</div>`,
        }),
        interactive: false,
        zIndexOffset: 1000,
        opacity: 0, // état par défaut : masqué (recalculé juste après l'ajout)
      });
      label.addTo(map);

      // Recalcule la visibilité : masquée seulement si les deux extrémités
      // sont dans le rectangle actuellement visible de la carte.
      const updateVisibility = () => {
        if (!label) return;
        const bounds = map.getBounds();
        const bothEndsVisible = bounds.contains(start) && bounds.contains(end);
        label.setOpacity(bothEndsVisible ? 0 : 1);
      };

      updateVisibility();

      // 'move'/'zoom' se déclenchent en continu pendant l'animation de
      // déplacement/zoom (contrairement à 'moveend'/'zoomend'), ce qui
      // garantit un comportement fluide sans devoir recréer la couche.
      map.on('move', updateVisibility);
      map.on('zoom', updateVisibility);

      cleanupRef.current = () => {
        map.off('move', updateVisibility);
        map.off('zoom', updateVisibility);
      };
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
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [positions, color, weight, onClick, fromName, toName, map]);

  return null; // Ce composant n'affiche rien directement (tout est géré par Leaflet)
}