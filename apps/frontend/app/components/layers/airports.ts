import type { Map } from 'mapbox-gl';

export function createAirportLayers(map: Map): void {
  const filter = ['==', ['get', 'type'], 'large_airport'];
  const gold = '#FFD700';

  map.addLayer({
    id: 'airports-large',
    type: 'circle',
    source: 'airports',
    filter,
    paint: {
      'circle-color': gold,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 6, 8, 12, 12],
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 0, 1, 12, 2],
      'circle-stroke-color': '#B8860B',
      'circle-opacity': 0.9,
    },
    minzoom: 5,
  });

  map.addLayer({
    id: 'airports-large-labels',
    type: 'symbol',
    source: 'airports',
    filter,
    layout: {
      'text-field': ['get', 'iata'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 10, 12, 14],
      'text-offset': [0, 1.5],
      'text-anchor': 'top',
      'text-optional': true,
    },
    paint: {
      'text-color': gold,
      'text-halo-color': '#000000',
      'text-halo-width': 1.5,
    },
    minzoom: 6,
  });
}
