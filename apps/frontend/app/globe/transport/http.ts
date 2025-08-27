import {
  FLIGHT_ROUTE_DETAIL_POINTS,
  SIMULATOR_HTTP_URL,
  validateFlightRouteResponse,
  type FlightRoutesGeoJSON,
  type FlightState,
  EMPTY_GEOJSON,
} from "@voyager/shared-ts";

export async function getFlightRoute(
  id: string,
  signal?: AbortSignal,
): Promise<FlightRoutesGeoJSON> {
  try {
    const response = await fetch(
      `${SIMULATOR_HTTP_URL}/geojson/flights/route?id=${id}&n=${FLIGHT_ROUTE_DETAIL_POINTS.toString()}`,
      signal ? { signal } : {},
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return validateFlightRouteResponse(data);
  } catch {
    return EMPTY_GEOJSON as FlightRoutesGeoJSON;
  }
}

export async function loadFlightRoute(
  selectedFlightId: string,
  routesSrc: mapboxgl.GeoJSONSource,
  flights: Map<string, FlightState>,
  setSelectedFlight: (flight: FlightState | null) => void,
): Promise<void> {
  const routes = await getFlightRoute(selectedFlightId);
  routesSrc.setData(routes);

  const baseFlight = flights.get(selectedFlightId);
  const routeFeature = routes.features[0];

  if (baseFlight && routeFeature) {
    setSelectedFlight({
      ...baseFlight,
      departureAirport: routeFeature.properties.departureAirport,
      arrivalAirport: routeFeature.properties.arrivalAirport,
    });
  }
}

export function getAirportsUrl(): string {
  return `${SIMULATOR_HTTP_URL}/geojson/airports`;
}
