// components/map/NetworkArrow.tsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator'; // Nécessite l'installation

interface NetworkArrowProps {
  positions: [number, number][];
  color?: string;
  weight?: number;
  onClick?: () => void;
}

export default function NetworkArrow({
  positions,
  color = '#2563eb',
  weight = 5,
  onClick,
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

    // Gestion du clic sur la ligne
    if (onClick) {
      polyline.on('click', onClick);
      decorator.on('click', onClick);
    }

    // Nettoyage à la destruction du composant
    return () => {
      map.removeLayer(polyline);
      map.removeLayer(decorator);
    };
  }, [positions, color, weight, onClick, map]);

  return null; // Ce composant n'affiche rien directement (tout est géré par Leaflet)
}