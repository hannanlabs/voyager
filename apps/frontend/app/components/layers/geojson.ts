import { greatCircle } from '@turf/turf';

import type { FlightState } from '@voyager/shared-ts';

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

export type FlightRouteGeometry =
  | {
      type: 'LineString';
      coordinates: [number, number][];
    }
  | {
      type: 'MultiLineString';
      coordinates: [number, number][][];
    };

export type FlightRouteFeature = {
  type: 'Feature';
  id: string;
  geometry: FlightRouteGeometry;
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

let airportCoords: Record<string, [number, number]> = {};

async function loadAirportCoords(): Promise<void> {
  if (typeof window === 'undefined') return; 
  if (Object.keys(airportCoords).length > 0) {
    return; 
  }
  
  try {
    const url = new URL('/data/airports.iata.geojson', window.location.origin).toString();
    const response = await fetch(url);
    const data = await response.json() as {
      features: Array<{
        properties: { iata: string };
        geometry: { coordinates: [number, number] };
      }>;
    };
    
    for (const feature of data.features) {
      const { iata } = feature.properties;
      const coords = feature.geometry.coordinates;
      
      airportCoords[iata] = coords; 
    }
  } catch (error: unknown) {
    console.error('Failed to load airport coordinates:', error);
    airportCoords = {};
  }
}


export async function toFlightRoutesGeoJSON(
  flights: Iterable<FlightState>,
  selectedFlightId?: string | null,
): Promise<FlightRoutesGeoJSON> {
  await loadAirportCoords();
  
  const features: FlightRouteFeature[] = [];

  if (!selectedFlightId) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  for (const flight of flights) {
    if (flight.id !== selectedFlightId) {
      continue;
    }

    const departureCoords = airportCoords[flight.departureAirport];
    const arrivalCoords = airportCoords[flight.arrivalAirport];

    if (!departureCoords || !arrivalCoords) {
      console.warn(`Missing coordinates for flight ${flight.id}: ${flight.departureAirport} -> ${flight.arrivalAirport}`);
      continue;
    }

    const greatCircleRoute = greatCircle(
      { type: 'Point', coordinates: departureCoords },
      { type: 'Point', coordinates: arrivalCoords },
      { npoints: 128 },
    );

    features.push({
      type: 'Feature',
      id: `${flight.id}-route`,
      geometry: greatCircleRoute.geometry as FlightRouteGeometry,
      properties: {
        id: flight.id,
        callSign: flight.callSign,
        airline: flight.airline,
        departureAirport: flight.departureAirport,
        arrivalAirport: flight.arrivalAirport,
        progress: flight.progress,
        phase: flight.phase,
        selected: true, 
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
