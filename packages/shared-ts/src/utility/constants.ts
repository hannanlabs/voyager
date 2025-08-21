export const FLIGHT_ROUTE_DETAIL_POINTS = 128;

export const EMPTY_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: []
};

export const MAP_CONFIG = {
  STYLE: 'mapbox://styles/mapbox/standard',
  PROJECTION: { name: 'globe' } as const,
  CENTER: [0, 20] as [number, number],
  ZOOM: 1.5,
  PITCH: 0,
  BEARING: 0
} as const;

export const MAP_SOURCES = {
  FLIGHTS_POINTS: 'flights-points',
  FLIGHTS_ROUTES: 'flights-routes',
  AIRPORTS: 'airports'
} as const;

export const MAP_LAYERS = {
  FLIGHTS_POINTS: 'flights-points-layer',
  FLIGHTS_ROUTES: 'flights-routes-layer'
} as const;