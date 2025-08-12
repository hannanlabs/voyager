'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

import { validateWebSocketMessage } from '@voyager/shared-ts';
import type { FlightState } from '@voyager/shared-ts';

interface WebSocketState {
  flights: Map<string, FlightState>;
  connected: boolean;
  error: string | null;
}

interface WebSocketContextValue extends WebSocketState {
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [state, setState] = useState<WebSocketState>({
    flights: new Map(),
    connected: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<FlightState[]>([]);
  const reconnectDelay = useRef(1000);

  const wsUrl = process.env.NEXT_PUBLIC_FLIGHTS_WS_URL;
  if (!wsUrl) {
    throw new Error('NEXT_PUBLIC_FLIGHTS_WS_URL environment variable is required');
  }

  const flushPendingUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.length === 0) return;

    const updates = pendingUpdatesRef.current;
    pendingUpdatesRef.current = [];

    setState(prevState => {
      const newFlights = new Map<string, FlightState>();
      
      for (const flight of updates) {
        newFlights.set(flight.id, flight);
      }

      const changed = prevState.flights.size !== newFlights.size ||
        Array.from(newFlights.values()).some(flight => {
          const existing = prevState.flights.get(flight.id);
          return !existing || 
            existing.lastComputedAt !== flight.lastComputedAt ||
            existing.position.latitude !== flight.position.latitude ||
            existing.position.longitude !== flight.position.longitude ||
            existing.phase !== flight.phase;
        });

      return changed 
        ? { ...prevState, flights: newFlights }
        : prevState;
    });

    updateThrottleRef.current = null;
  }, []);

  const scheduleUpdate = useCallback((flights: FlightState[]) => {
    pendingUpdatesRef.current = flights; 

    if (updateThrottleRef.current) return; 

    const delay = document.hidden ? 2000 : 100; 

    if (!document.hidden) {
      updateThrottleRef.current = setTimeout(() => {
        requestAnimationFrame(flushPendingUpdates);
      }, 0);
    } else {
      updateThrottleRef.current = setTimeout(flushPendingUpdates, delay);
    }
  }, [flushPendingUpdates]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: unknown = JSON.parse(event.data as string);
      const message = validateWebSocketMessage(data);

      scheduleUpdate(message.flights);
    } catch (error) {
      console.error('[WS] Invalid message:', error);
      setState(prev => ({
        ...prev,
        error: `Invalid message format: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [scheduleUpdate]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return; 
    }

    try {
      console.log('[WS] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        setState(prev => ({ ...prev, connected: true, error: null }));
        reconnectDelay.current = 1000; 
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('[WS] Disconnected:', event.code, event.reason);
        setState(prev => ({ 
          ...prev, 
          connected: false, 
          error: event.wasClean ? null : 'Connection lost'
        }));
        
        if (!event.wasClean) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Connection error:', error);
        setState(prev => ({ 
          ...prev, 
          connected: false, 
          error: 'Connection failed' 
        }));
      };

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Failed to create WebSocket: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [handleMessage, wsUrl]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectDelay.current = Math.min(
      reconnectDelay.current * 2 + Math.random() * 1000,
      30000
    );
    
    console.log('[WS] Reconnecting in', `${String(reconnectDelay.current)}ms`);
    reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay.current);
  }, [connect]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual reconnect');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    pendingUpdatesRef.current = [];
    if (updateThrottleRef.current) {
      clearTimeout(updateThrottleRef.current);
      updateThrottleRef.current = null;
    }
    
    reconnectDelay.current = 1000; 
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (updateThrottleRef.current) {
        clearTimeout(updateThrottleRef.current);
      }
    };
  }, [connect]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && pendingUpdatesRef.current.length > 0) {
        flushPendingUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushPendingUpdates]);

  const contextValue: WebSocketContextValue = {
    ...state,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export const useFlights = useWebSocket;