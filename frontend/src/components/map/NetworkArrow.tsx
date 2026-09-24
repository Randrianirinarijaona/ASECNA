import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
// @ts-ignore: Missing type definitions for leaflet
import L from 'leaflet';
import 'leaflet-polylinedecorator';
import { LINK_STATUS_LABELS } from '../../data/networkCategories';
import type { LinkDirection, LinkStatus } from '../../data/networkCategories';

interface NetworkArrowProps {
  positions: [number, number][];
  color?: string;
  weight?: number;
  onClick?: () => void;
  fromName?: string;
  toName?: string;
  direction?: LinkDirection;
  status?: LinkStatus;
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
  weight = 4,
  onClick,
  fromName,
  toName,
  // CORRIGÉ : valeur par défaut alignée sur le backend.
  direction = 'outgoing',
  status = 'operational',
}: NetworkArrowProps) {
  const map = useMap();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (positions.length < 2) return;

    const start = L.latLng(positions[0]);
    const end = L.latLng(positions[positions.length - 1]);

    const effectiveColor = status === 'out_of_service' ? '#94a3b8' : color;
    const dashArray = status === 'operational' ? undefined : '8 6';
    const baseOpacity = status === 'operational' ? 0.85 : 0.6;

    const polyline = L.polyline(positions, {
      color: effectiveColor,
      weight: 2,
      opacity: baseOpacity,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray,
      className: 'leaflet-network-polyline',
    });

    const arrowSymbol = (pathColor: string) => ({
      offset: '55%',
      repeat: 0,
      symbol: L.Symbol.arrowHead({
        pixelSize: 14,
        polygon: true,
        pathOptions: { stroke: false, fill: true, fillColor: pathColor, fillOpacity: 1 },
      }),
    });

    // CORRIGÉ : comparaisons alignées sur les valeurs anglaises de l'enum.
    const showForwardArrow = direction === 'outgoing' || direction === 'both';
    const showReverseArrow = direction === 'incoming' || direction === 'both';

    let forwardDecorator: any = null;
    let reverseDecorator: any = null;

    polyline.addTo(map);

    if (showForwardArrow) {
      forwardDecorator = L.polylineDecorator(polyline, { patterns: [arrowSymbol(effectiveColor)] });
      forwardDecorator.addTo(map);
    }
    if (showReverseArrow) {
      const reversedLine = L.polyline([...positions].reverse());
      reverseDecorator = L.polylineDecorator(reversedLine, { patterns: [arrowSymbol(effectiveColor)] });
      reverseDecorator.addTo(map);
    }

    let label: L.Marker | null = null;

    

    if (onClick) {
      polyline.on('click', onClick);
      if (forwardDecorator) forwardDecorator.on('click', onClick);
      if (reverseDecorator) reverseDecorator.on('click', onClick);

      polyline.on('mouseover', () => polyline.setStyle({ opacity: 1, weight: weight + 2 }));
      polyline.on('mouseout', () => polyline.setStyle({ opacity: baseOpacity, weight:2 }));
    }

    return () => {
      map.removeLayer(polyline);
      if (forwardDecorator) map.removeLayer(forwardDecorator);
      if (reverseDecorator) map.removeLayer(reverseDecorator);
      if (label) map.removeLayer(label);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [positions, color, weight, onClick, fromName, toName, direction, status, map]);

  return null;
}