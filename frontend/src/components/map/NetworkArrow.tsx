import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
// @ts-ignore: Missing type definitions for leaflet
import L from 'leaflet';
import 'leaflet-polylinedecorator';

interface NetworkArrowProps {
  positions: [number, number][];
  color?: string;
  weight?: number;
  onClick?: () => void;
  fromName?: string;
  toName?: string;
}

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
  weight = 4, // Légèrement affiné pour un rendu plus premium
  onClick,
  fromName,
  toName,
}: NetworkArrowProps) {
  const map = useMap();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (positions.length < 2) return;

    const start = L.latLng(positions[0]);
    const end = L.latLng(positions[positions.length - 1]);

    const polyline = L.polyline(positions, {
      color,
      weight,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'leaflet-network-polyline'
    });

    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: '55%', // Centré élégamment sur le segment
          repeat: 0,
          symbol: L.Symbol.arrowHead({
            pixelSize: 14,
            polygon: true, // Flèche pleine moderne
            pathOptions: {
              stroke: false,
              fill: true,
              fillColor: color,
              fillOpacity: 1,
            },
          }),
        },
      ],
    });

    polyline.addTo(map);
    decorator.addTo(map);

    let label: L.Marker | null = null;

    if (fromName && toName) {
      const midLat = (start.lat + end.lat) / 2;
      const midLng = (start.lng + end.lng) / 2;
      const labelText = `${escapeHtml(fromName)} &rarr; ${escapeHtml(toName)}`;

      label = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'network-arrow-label-icon',
          html: `<div style="
            background: var(--color-card, #ffffff);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            color: ${color};
            border: 1px solid var(--color-border, #e2e8f0);
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
            pointer-events: none;
            transform: translate(-50%, -50%);
            transition: all 0.2s ease;
          ">${labelText}</div>`,
        }),
        interactive: false,
        zIndexOffset: 1000,
        opacity: 0,
      });
      label.addTo(map);

      const updateVisibility = () => {
        if (!label) return;
        const bounds = map.getBounds();
        const bothEndsVisible = bounds.contains(start) && bounds.contains(end);
        label.setOpacity(bothEndsVisible ? 0 : 1);
      };

      updateVisibility();

      map.on('move', updateVisibility);
      map.on('zoom', updateVisibility);

      cleanupRef.current = () => {
        map.off('move', updateVisibility);
        map.off('zoom', updateVisibility);
      };
    }

    if (onClick) {
      polyline.on('click', onClick);
      decorator.on('click', onClick);
      
      // Feedback visuel au survol
      polyline.on('mouseover', () => polyline.setStyle({ opacity: 1, weight: weight + 2 }));
      polyline.on('mouseout', () => polyline.setStyle({ opacity: 0.85, weight }));
    }

    return () => {
      map.removeLayer(polyline);
      map.removeLayer(decorator);
      if (label) map.removeLayer(label);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [positions, color, weight, onClick, fromName, toName, map]);

  return null;
}