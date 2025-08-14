import type { FlightState } from '@voyager/shared-ts';

export function geoJSONFeatureToFlightState(feature: any): FlightState | null {
  const props = feature.properties;
  const coords = feature.geometry?.coordinates;
  
  if (!props || !coords || !props.id) {
    return null;
  }

  return {
    id: props.id,
    callSign: props.callSign || '',
    airline: props.airline || '',
    departureAirport: props.departureAirport || '',
    arrivalAirport: props.arrivalAirport || '',
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
    distanceRemaining: props.distanceRemaining || 0,
    scheduledDeparture: props.scheduledDeparture || '',
    scheduledArrival: props.scheduledArrival || '',
    estimatedArrival: props.estimatedArrival || '',
    lastComputedAt: props.lastComputedAt || '',
    traceID: props.traceID || '',
  };
}

export function extractFlightsFromGeoJSON(geoJSON: any): Map<string, FlightState> {
  const flightsMap = new Map<string, FlightState>();
  
  if (!geoJSON?.features) {
    return flightsMap;
  }

  geoJSON.features.forEach((feature: any) => {
    const flightState = geoJSONFeatureToFlightState(feature);
    if (flightState) {
      flightsMap.set(flightState.id, flightState);
    }
  });

  return flightsMap;
}

export function addSelectionToGeoJSON(geoJSON: any, selectedFlightId: string | null): any {
  if (!geoJSON?.features) {
    return { type: 'FeatureCollection', features: [] };
  }

  // Efficiently modify features in place rather than recreating the entire structure
  const features = geoJSON.features.map((feature: any) => ({
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