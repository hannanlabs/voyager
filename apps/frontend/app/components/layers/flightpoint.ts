import type { Map } from 'mapbox-gl';
import type { FlightsPointsLayerConfig } from '@voyager/shared-ts';

export function createFlightsPointsLayer(map: Map, config: FlightsPointsLayerConfig): void {
  const { sourceId, layerId } = config;

  map.addLayer({
    id: layerId,
    type: 'symbol',
    source: sourceId,
    layout: {
      'icon-image': 'airplane-icon',
      'icon-size': ['interpolate', ['linear'], ['zoom'], 1, 0.8, 5, 1.2, 10, 1.8, 15, 2.5],
      'icon-rotate': ['get', 'bearing'],
      'icon-rotation-alignment': 'map',
      'icon-pitch-alignment': 'map',
      'icon-allow-overlap': true,
      'symbol-sort-key': [
        'case',
        ['==', ['get', 'phase'], 'cruise'],
        3,
        ['==', ['get', 'phase'], 'climb'],
        2,
        ['==', ['get', 'phase'], 'descent'],
        2,
        1,
      ],
    },
    paint: {
      'icon-color': [
        'case',
        ['boolean', ['get', 'selected'], false],
        '#ffffff',
        [
          'case',
          ['==', ['get', 'phase'], 'takeoff'],
          '#ff6b35',
          ['==', ['get', 'phase'], 'climb'],
          '#f7931e',
          ['==', ['get', 'phase'], 'cruise'],
          '#2ecc71',
          ['==', ['get', 'phase'], 'descent'],
          '#f39c12',
          ['==', ['get', 'phase'], 'landing'],
          '#e74c3c',
          '#95a5a6',
        ],
      ],
      'icon-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.6, 5, 0.8, 10, 1.0],
    },
  });
}

export function addFlightInteractions(map: Map, config: FlightsPointsLayerConfig): void {
  const { layerId, onFlightClick, onFlightHover } = config;

  map.on('click', layerId, (e) => {
    if (!e.features || e.features.length === 0) return;
    const feature = e.features[0];
    const flightId = feature?.properties?.id as string | undefined;
    if (flightId && onFlightClick) {
      onFlightClick(flightId);
    }
  });

  map.on('mouseenter', layerId, (e) => {
    map.getCanvas().style.cursor = 'pointer';
    if (!e.features || e.features.length === 0) return;
    const feature = e.features[0];
    const flightId = feature?.properties?.id as string | undefined;
    if (flightId && onFlightHover) {
      onFlightHover(flightId);
    }
  });

  map.on('mouseleave', layerId, () => {
    map.getCanvas().style.cursor = '';

    if (onFlightHover) {
      onFlightHover(null);
    }
  });
}
