import type { Airport } from '../types';

export const AIRPORTS: Record<string, Airport> = {

  ivato: {

    name: 'Ivato',

    iata: 'TNR',

    coords: [-18.796, 47.478],

    markerClass: 'international'

  },

  toamasina: {

    name: 'Toamasina',

    iata: 'TMM',

    coords: [-18.1095, 49.3925],

    markerClass: 'national'

  },

  mahajanga: {

    name: 'Mahajanga',

    iata: 'MJN',

    coords: [-15.6671, 46.3518],

    markerClass: 'national'

  }

};