import { MockFlightsSource } from './MockFlightsSource';
import { WebSocketFlightsSource } from './WebSocketFlightsSource';

import type { FlightDataSource } from './FlightDataSource';

export type FlightDataMode = 'auto' | 'mock' | 'ws';

export type FlightSourceConfig = {
  mode: FlightDataMode;
  wsUrl?: string;
  updateHz?: number;
};

export function createFlightsSource(config: FlightSourceConfig): FlightDataSource {
  const { mode, wsUrl, updateHz = 6 } = config;

  switch (mode) {
    case 'mock':
      return new MockFlightsSource(updateHz);

    case 'ws':
      if (!wsUrl) {
        throw new Error('WebSocket URL is required when using ws mode');
      }
      return new WebSocketFlightsSource(wsUrl);

    case 'auto':
    default:
      // Auto mode: try WebSocket if URL is available, fallback to mock
      if (wsUrl) {
        try {
          return new WebSocketFlightsSource(wsUrl);
        } catch (error) {
          console.warn('Failed to create WebSocket source, falling back to mock:', error);
          return new MockFlightsSource(updateHz);
        }
      } else {
        console.warn('No WebSocket URL provided, using mock data source');
        return new MockFlightsSource(updateHz);
      }
  }
}
