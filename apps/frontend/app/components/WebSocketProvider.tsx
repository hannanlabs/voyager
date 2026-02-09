"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { FlightState, WebSocketStatus, FlightPointsGeoJSON } from "@voyager/shared-ts";
import { WS_STATUS } from "@voyager/shared-ts";
import { createFlightWebSocket } from "@/lib/websocket";

const FlightContext = createContext<{
  flights: Map<string, FlightState>;
  flightsGeoJSON: FlightPointsGeoJSON | null;
  status: WebSocketStatus;
}>({
  flights: new Map(),
  flightsGeoJSON: null,
  status: WS_STATUS.CONNECTING,
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [flights, setFlights] = useState<Map<string, FlightState>>(new Map());
  const [flightsGeoJSON, setFlightsGeoJSON] = useState<FlightPointsGeoJSON | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>(WS_STATUS.CONNECTING);

  useEffect(() => {
    const connection = createFlightWebSocket(
      (flightMap, geoJSON) => {
        setFlights(flightMap);
        setFlightsGeoJSON(geoJSON);
      },
      setStatus,
    );

    return () => connection.close();
  }, []);

  return (
    <FlightContext.Provider value={{ flights, flightsGeoJSON, status }}>
      {children}
    </FlightContext.Provider>
  );
}

export function useFlights() {
  return useContext(FlightContext);
}
