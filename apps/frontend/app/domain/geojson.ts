import { greatCircle } from '@turf/turf';

import type { FlightState } from './flight';

export type FlightPointFeature = {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number, number];
  };
  properties: {
    id: string;
    callSign: string;
    airline: string;
    phase: string;
    bearing: number;
    speed: number;
    altitude: number;
    progress: number;
    selected?: boolean;
  };
};

export type FlightRouteFeature = {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: {
    id: string;
    callSign: string;
    airline: string;
    departureAirport: string;
    arrivalAirport: string;
    progress: number;
    phase: FlightState['phase'];
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

export function toFlightPointsGeoJSON(
  flights: Iterable<FlightState>,
  selectedFlightId?: string | null,
): FlightPointsGeoJSON {
  const features: FlightPointFeature[] = [];

  for (const flight of flights) {
    features.push({
      type: 'Feature',
      id: flight.id,
      geometry: {
        type: 'Point',
        coordinates: [
          flight.position.longitude,
          flight.position.latitude,
          flight.position.altitude,
        ],
      },
      properties: {
        id: flight.id,
        callSign: flight.callSign,
        airline: flight.airline,
        phase: flight.phase,
        bearing: flight.bearing,
        speed: flight.speed,
        altitude: flight.altitude,
        progress: flight.progress,
        selected: selectedFlightId === flight.id,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

const AIRPORT_COORDS = {
  JFK: [-73.7781, 40.6413] as [number, number],
  LAX: [-118.4081, 33.9425] as [number, number],
  ATL: [-84.4277, 33.6407] as [number, number],
  SEA: [-122.3088, 47.4502] as [number, number],
  DEN: [-104.6737, 39.8561] as [number, number],
  ORD: [-87.9073, 41.9742] as [number, number],
};

export function toFlightRoutesGeoJSON(
  flights: Iterable<FlightState>,
  selectedFlightId?: string | null,
): FlightRoutesGeoJSON {
  const features: FlightRouteFeature[] = [];

  for (const flight of flights) {
    const departureCoords = AIRPORT_COORDS[flight.departureAirport as keyof typeof AIRPORT_COORDS];
    const arrivalCoords = AIRPORT_COORDS[flight.arrivalAirport as keyof typeof AIRPORT_COORDS];

    // Create great circle route for better globe visualization
    const greatCircleRoute = greatCircle(
      { type: 'Point', coordinates: departureCoords },
      { type: 'Point', coordinates: arrivalCoords },
      { npoints: 50 }, // More points for smoother curve on globe
    );

    // Normalize coordinates as LineString for Mapbox
    const coords =
      greatCircleRoute.geometry.type === 'LineString'
        ? (greatCircleRoute.geometry.coordinates as [number, number][])
        : ((greatCircleRoute.geometry.coordinates as [number, number][][])[0] ?? []);

    features.push({
      type: 'Feature',
      id: `${flight.id}-route`,
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: {
        id: flight.id,
        callSign: flight.callSign,
        airline: flight.airline,
        departureAirport: flight.departureAirport,
        arrivalAirport: flight.arrivalAirport,
        progress: flight.progress,
        phase: flight.phase,
        selected: selectedFlightId === flight.id,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
