import type { FlightState } from '../flight/state';

export type FlightRouteGeometry =
  | { type: 'LineString'; coordinates: ([number, number] | [number, number, number])[] }
  | { type: 'MultiLineString'; coordinates: ([number, number] | [number, number, number])[][] };

export type FlightPointFeature = {
  type: 'Feature';
  id: string;
  geometry: { type: 'Point'; coordinates: [number, number, number] };
  properties: {
    id: string;
    callSign: string;
    airline: string;
    phase: FlightState['phase'];
    bearing: number;
    speed: number;
    altitude: number;
    progress: number;
    selected?: boolean;
  };
};

export type FlightRouteFeature = {
  type: 'Feature';
  id?: string;
  geometry: FlightRouteGeometry;
  properties: {
    id: string;
    callSign: string;
    airline?: string;
    departureAirport: string;
    arrivalAirport: string;
    progress?: number;
    phase?: FlightState['phase'];
    selected?: boolean;
  };
};

export type FlightPointsGeoJSON = {
  type: 'FeatureCollection';
  features: FlightPointFeature[];
};

export type FlightRoutesGeoJSON = {
  type: 'FeatureCollection';
  features: FlightRouteFeature[];
};

// Transform functions
export function geoJSONFeatureToFlightState(feature: FlightPointFeature): FlightState | null {
  const props = feature.properties;
  const coords = feature.geometry?.coordinates;
  
  if (!props || !coords || !props.id) {
    return null;
  }

  return {
    id: props.id,
    callSign: props.callSign || '',
    airline: props.airline || '',
    departureAirport: '',
    arrivalAirport: '', 
    phase: props.phase || 'cruise',
    position: {
      latitude: coords[1] || 0,
      longitude: coords[0] || 0,
      altitude: coords[2] || props.altitude || 0,
    },
    velocity: {
      x: 0, 
      y: 0, 
      z: 0, 
    },
    bearing: props.bearing || 0,
    speed: props.speed || 0,
    altitude: props.altitude || 0,
    progress: props.progress || 0,
    distanceRemaining: 0,
    scheduledDeparture: '', 
    scheduledArrival: '', 
    estimatedArrival: '',
    lastComputedAt: '', 
    traceID: '', 
  };
}

export function extractFlightsFromGeoJSON(geoJSON: FlightPointsGeoJSON): Map<string, FlightState> {
  const flightsMap = new Map<string, FlightState>();
  
  if (!geoJSON?.features) {
    return flightsMap;
  }

  geoJSON.features.forEach((feature) => {
    const flightState = geoJSONFeatureToFlightState(feature);
    if (flightState) {
      flightsMap.set(flightState.id, flightState);
    }
  });

  return flightsMap;
}

export function addSelectionToGeoJSON<T extends { features: Array<{ properties: { id: string; selected?: boolean } }> }>(
  geoJSON: T, 
  selectedFlightId: string | null
): T {
  if (!geoJSON?.features) {
    return { ...geoJSON, features: [] };
  }

  const features = geoJSON.features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      selected: selectedFlightId === feature.properties.id,
    },
  }));

  return {
    ...geoJSON,
    features,
  };
}