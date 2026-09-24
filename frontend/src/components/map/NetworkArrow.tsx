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

    if (fromName && toName) {
      const midLat = (start.lat + end.lat) / 2;
      const midLng = (start.lng + end.lng) / 2;

      // CORRIGÉ : comparaisons alignées sur les valeurs anglaises de l'enum.
      const directionGlyph =
        direction === 'incoming' ? '&larr;' : direction === 'both' ? '&harr;' : '&rarr;';
      let labelText = `${escapeHtml(fromName)} ${directionGlyph} ${escapeHtml(toName)}`;
      if (status !== 'operational') {
        labelText += ` &middot; ${escapeHtml(LINK_STATUS_LABELS[status])}`;
      }

      label = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'network-arrow-label-icon',
          html: `<div style="
            background: var(--color-card, #ffffff);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            color: ${effectiveColor};
            border: 1px solid var(--color-border, #ffffff);
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