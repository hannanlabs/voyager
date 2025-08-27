import {
  validateFlightRouteResponse,
  type FlightRoutesGeoJSON,
  FLIGHT_ROUTE_DETAIL_POINTS,
  EMPTY_GEOJSON,
} from '@voyager/shared-ts';

const BASE_URL = process.env.NEXT_PUBLIC_SIMULATOR_HTTP_URL || '';

async function fetchApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, signal ? { signal } : {});
  if (!response.ok) {
    throw new Error(`HTTP ${response.status.toString()}: ${response.statusText}`);
  }
  return response.json() as T;
}

export async function getFlightRoute(
  id: string,
  signal?: AbortSignal,
): Promise<FlightRoutesGeoJSON> {
  try {
    const data = await fetchApi(
      `/geojson/flights/route?id=${id}&n=${FLIGHT_ROUTE_DETAIL_POINTS.toString()}`,
      signal,
    );
    return validateFlightRouteResponse(data);
  } catch {
    return EMPTY_GEOJSON as FlightRoutesGeoJSON;
  }
}

export function getAirportsUrl(): string {
  return `${BASE_URL}/geojson/airports`;
}
