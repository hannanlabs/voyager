import { useEffect, useState } from 'react';
import {
  validateFlightRouteResponse,
  validateAirportsResponse,
  type FlightRoutesGeoJSON,
  type AirportsGeoJSON,
  FLIGHT_ROUTE_DETAIL_POINTS,
  EMPTY_GEOJSON,
} from '@voyager/shared-ts';

const BASE = process.env.NEXT_PUBLIC_SIMULATOR_HTTP_URL || '';

export async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`HTTP ${res.status.toString()}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function getFlightRoute(
  id: string,
  n = FLIGHT_ROUTE_DETAIL_POINTS,
): Promise<FlightRoutesGeoJSON> {
  const json = await getJSON(
    `/geojson/flights/route?id=${encodeURIComponent(id)}&n=${n.toString()}`,
  );
  return validateFlightRouteResponse(json);
}

export async function getAirportsGeoJSON(): Promise<AirportsGeoJSON> {
  const json = await getJSON('/geojson/airports');
  return validateAirportsResponse(json);
}

export function useFlightRoute(flightId: string | null) {
  const [data, setData] = useState<FlightRoutesGeoJSON | null>(null);

  useEffect(() => {
    if (!flightId) {
      setData(EMPTY_GEOJSON as FlightRoutesGeoJSON);
      return;
    }

    const ctrl = new AbortController();

    getFlightRoute(flightId)
      .then(setData)
      .catch(() => {
        setData(EMPTY_GEOJSON as FlightRoutesGeoJSON);
      });

    return () => {
      ctrl.abort();
    };
  }, [flightId]);

  return data;
}
