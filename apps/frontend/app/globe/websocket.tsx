'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { FlightState } from '@voyager/shared-ts';

export function useFlightsSocket(url: string, retryMs = 2000) {
  const [flights, setFlights] = useState<Map<string, FlightState>>(new Map());
  const [status, setStatus] = useState<'connecting'|'open'|'closed'|'error'>('connecting');
  const retryRef = useRef<number | null>(null);

  useEffect(() => {
    let closed = false;
    let ws: WebSocket | null = null;

    const connect = () => {
      setStatus('connecting');
      ws = new WebSocket(url);
      ws.onopen = () => setStatus('open');
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data as string);
          const next: FlightState[] = data.flights ?? [];
          setFlights(new Map(next.map(f => [f.id, f])));
        } catch {
          setStatus('error');
        }
      };
      ws.onerror = () => setStatus('error');
      ws.onclose = () => {
        setStatus('closed');
        if (!closed) retryRef.current = window.setTimeout(connect, retryMs);
      };
    };

    connect();
    return () => {
      closed = true;
      if (retryRef.current) window.clearTimeout(retryRef.current);
      ws?.close(1000, 'unmount');
    };
  }, [url, retryMs]);

  return { flights, status };
}

type Ctx = { flights: Map<string, FlightState>; status: 'connecting'|'open'|'closed'|'error' };
const WebSocketContext = createContext<Ctx | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_FLIGHTS_WS_URL!;
  const { flights, status } = useFlightsSocket(url, 2000);
  return <WebSocketContext.Provider value={{ flights, status }}>{children}</WebSocketContext.Provider>;
}

export const useFlights = (): Ctx => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useFlights must be used within WebSocketProvider');
  return ctx;
};