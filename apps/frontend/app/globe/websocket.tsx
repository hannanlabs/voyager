'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { FlightState, WebSocketStatus } from '@voyager/shared-ts';
import { validateWebSocketMessage, WS_STATUS } from '@voyager/shared-ts';
import { extractFlightsFromGeoJSON } from './utils';

const WebSocketContext = createContext<{
  flights: Map<string, FlightState>;
  flightsGeoJSON: any | null;
  flightCount: number;
  status: WebSocketStatus;
}>({
  flights: new Map(),
  flightsGeoJSON: null,
  flightCount: 0,
  status: WS_STATUS.CONNECTING,
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [flights, setFlights] = useState<Map<string, FlightState>>(new Map());
  const [flightsGeoJSON, setFlightsGeoJSON] = useState<any | null>(null);
  const [flightCount, setFlightCount] = useState<number>(0);
  const [status, setStatus] = useState<WebSocketStatus>(WS_STATUS.CONNECTING);
  const retryRef = useRef<number | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_FLIGHTS_WS_URL!;
    let closed = false;

    const connect = () => {
      setStatus(WS_STATUS.CONNECTING);
      const ws = new WebSocket(url);
      
      ws.onopen = () => setStatus(WS_STATUS.OPEN);
      ws.onmessage = (e) => {
        try {
          const message = validateWebSocketMessage(JSON.parse(e.data));
          
          if (message.type === 'flights_geojson') {
            setFlightsGeoJSON(message.featureCollection);
            const flightsMap = extractFlightsFromGeoJSON(message.featureCollection);
            setFlights(flightsMap);
            setFlightCount(flightsMap.size);
          }
        } catch {
          setStatus(WS_STATUS.ERROR);
        }
      };
      ws.onerror = () => setStatus(WS_STATUS.ERROR);
      ws.onclose = () => {
        setStatus(WS_STATUS.CLOSED);
        if (!closed) retryRef.current = window.setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      closed = true;
      if (retryRef.current) window.clearTimeout(retryRef.current);
    };
  }, []);

  return <WebSocketContext.Provider value={{ flights, flightsGeoJSON, flightCount, status }}>{children}</WebSocketContext.Provider>;
}

export const useFlights = () => useContext(WebSocketContext);