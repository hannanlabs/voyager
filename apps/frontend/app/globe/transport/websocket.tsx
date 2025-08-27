'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { FlightState, WebSocketStatus, FlightPointsGeoJSON } from '@voyager/shared-ts';
import { validateWebSocketMessage, WS_STATUS, extractFlightsFromGeoJSON } from '@voyager/shared-ts';

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

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const websocketUrl = process.env.NEXT_PUBLIC_FLIGHTS_WS_URL;
    if (!websocketUrl) {
      setStatus(WS_STATUS.ERROR);
      return;
    }
    let shouldConnect = true;

    const websocket = new WebSocket(websocketUrl);
    wsRef.current = websocket;
    setStatus(WS_STATUS.CONNECTING);

    websocket.onopen = () => {
      setStatus(WS_STATUS.OPEN);
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      try {
        const message = validateWebSocketMessage(JSON.parse(event.data as string));
        const flightMap = extractFlightsFromGeoJSON(message.featureCollection);

        setFlightsGeoJSON(message.featureCollection);
        setFlights(flightMap);
      } catch (error) {
        console.error('Failed to process WebSocket message:', error);
        setStatus(WS_STATUS.ERROR);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus(WS_STATUS.ERROR);
    };

    websocket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setStatus(WS_STATUS.CLOSED);

      if (shouldConnect && event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldConnect) {
            window.location.reload();
          }
        }, 3000);
      }
    };

    return () => {
      shouldConnect = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
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
