import { greatCircle } from '@turf/turf';

import type { FlightState, FlightPointFeature, FlightRouteFeature, FlightRouteGeometry, FlightPointsGeoJSON, FlightRoutesGeoJSON } from '@voyager/shared-ts';
import { ensureAirportCoordsLoaded, getAirportCoord } from './airportCoords';

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

export async function toFlightRoutesGeoJSON(
  flights: Iterable<FlightState>,
  selectedFlightId?: string | null,
): Promise<FlightRoutesGeoJSON> {
  if (!selectedFlightId) return { type: 'FeatureCollection', features: [] };
  
  await ensureAirportCoordsLoaded();
  const features: FlightRouteFeature[] = [];

  for (const flight of flights) {
    if (flight.id !== selectedFlightId) continue;

    const departureCoords = await getAirportCoord(flight.departureAirport);
    const arrivalCoords = await getAirportCoord(flight.arrivalAirport);
    
    if (!departureCoords || !arrivalCoords) continue;

    const route = greatCircle(
      { type: 'Point', coordinates: departureCoords },
      { type: 'Point', coordinates: arrivalCoords },
      { npoints: 128 }
    );

    features.push({
      type: 'Feature',
      id: `${flight.id}-route`,
      geometry: route.geometry as FlightRouteGeometry,
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

  return { type: 'FeatureCollection', features };
}
