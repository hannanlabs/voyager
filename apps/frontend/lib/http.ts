import {
  FLIGHT_ROUTE_DETAIL_POINTS,
  SIMULATOR_HTTP_URL,
  validateFlightRouteResponse,
  type FlightRoutesGeoJSON,
  type FlightState,
  EMPTY_GEOJSON,
} from "@voyager/shared-ts";

export async function loadFlightRoute(
  selectedFlightId: string,
  routesSrc: mapboxgl.GeoJSONSource,
  flights: Map<string, FlightState>,
  setSelectedFlight: (flight: FlightState | null) => void,
): Promise<void> {
  let routes: FlightRoutesGeoJSON;
  try {
    const response = await fetch(
      `${SIMULATOR_HTTP_URL}/geojson/flights/route?id=${selectedFlightId}&n=${FLIGHT_ROUTE_DETAIL_POINTS.toString()}`,
    );
    const data = await response.json();
    routes = validateFlightRouteResponse(data);
  } catch {
    routes = EMPTY_GEOJSON as FlightRoutesGeoJSON;
  }

  routesSrc.setData(routes);

  const baseFlight = flights.get(selectedFlightId);

  if (baseFlight && routes.features[0]) {
    setSelectedFlight({
      ...baseFlight,
      departureAirport: routes.features[0].properties.departureAirport,
      arrivalAirport: routes.features[0].properties.arrivalAirport,
    });
  }
}

export function getAirportsUrl(): string {
  return `${SIMULATOR_HTTP_URL}/geojson/airports`;
}
