import { useState, useEffect, useRef, useCallback } from 'react';

import { createFlightsSource } from './sources/flightSourceFactory';

import type { FlightState } from '../domain/flight';
import type { FlightDataSource } from './sources/FlightDataSource';
import type { FlightDataMode } from './sources/flightSourceFactory';

type UseFlightsResult = {
  flights: Map<string, FlightState>;
  connected: boolean;
  error: string | null;
};

type UseFlightsConfig = {
  updateHz?: number;
  dataMode?: FlightDataMode;
  wsUrl?: string;
};

export function useFlights(config: UseFlightsConfig = {}): UseFlightsResult {
  const [flights, setFlights] = useState<Map<string, FlightState>>(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceRef = useRef<FlightDataSource | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const envMode = process.env.NEXT_PUBLIC_DATA_MODE as FlightDataMode | undefined;
  const {
    updateHz = 6,
    dataMode = envMode ?? 'auto',
    wsUrl = process.env.NEXT_PUBLIC_FLIGHTS_WS_URL,
  } = config;

  const handleUpdate = useCallback((updates: FlightState[]) => {
    setFlights(() => {
      const newFlights = new Map<string, FlightState>();
      for (const flight of updates) {
        newFlights.set(flight.id, flight);
      }
      return newFlights;
    });
  }, []);

  useEffect(() => {
    // Build config and omit wsUrl when undefined to satisfy exactOptionalPropertyTypes
    const cfg: { mode: FlightDataMode; updateHz: number; wsUrl?: string } = {
      mode: dataMode,
      updateHz,
    };
    if (wsUrl !== undefined) {
      cfg.wsUrl = wsUrl;
    }

    let statusCleanup: (() => void) | null = null;

    try {
      const source = createFlightsSource(cfg);
      sourceRef.current = source;

      // Set up status monitoring
      statusCleanup = source.onStatus(setConnected);

      // Get initial data
      const initialFlights = source.getInitial();
      setFlights(initialFlights);
      setError(null);

      // Performance throttling for hidden tabs
      let lastUpdate = 0;
      const throttledUpdate = (updates: FlightState[]) => {
        const now = Date.now();
        const isHidden = document.hidden;
        const minInterval = isHidden ? 2000 : 167; // 0.5Hz hidden, ~6Hz visible
        if (now - lastUpdate > minInterval) {
          handleUpdate(updates);
          lastUpdate = now;
        }
      };

      // Start receiving updates
      cleanupRef.current = source.start(throttledUpdate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize flight data source');
      setConnected(false);
    }

    // Always return a cleanup function to satisfy noImplicitReturns
    return () => {
      if (statusCleanup) statusCleanup();
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      sourceRef.current = null;
    };
  }, [updateHz, dataMode, wsUrl, handleUpdate]);

  return { flights, connected, error };
}
