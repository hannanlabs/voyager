import type { FlightDataSource } from './FlightDataSource';
import type { FlightState } from '../../domain/flight';

export class WebSocketFlightsSource implements FlightDataSource {
  private flights = new Map<string, FlightState>();
  private websocket: WebSocket | null = null;
  private connected = false;
  private statusCallbacks = new Set<(connected: boolean) => void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private wsUrl: string) {}

  getInitial(): Map<string, FlightState> {
    return new Map(this.flights);
  }

  start(emit: (updates: FlightState[]) => void): () => void {
    this.connect(emit);

    return () => {
      this.disconnect();
    };
  }

  private connect(emit: (updates: FlightState[]) => void): void {
    try {
      this.websocket = new WebSocket(this.wsUrl);

      this.websocket.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.notifyStatusChange();
      };

      type FlightUpdatesMsg = { type: 'flight_updates'; flights: FlightState[] };
      type InitialStateMsg = { type: 'initial_state'; flights: FlightState[] };

      const isFlightUpdatesMsg = (v: unknown): v is FlightUpdatesMsg =>
        typeof v === 'object' &&
        v !== null &&
        (v as { type?: unknown }).type === 'flight_updates' &&
        Array.isArray((v as { flights?: unknown }).flights);

      const isInitialStateMsg = (v: unknown): v is InitialStateMsg =>
        typeof v === 'object' &&
        v !== null &&
        (v as { type?: unknown }).type === 'initial_state' &&
        Array.isArray((v as { flights?: unknown }).flights);

      this.websocket.onmessage = (event) => {
        try {
          if (typeof event.data !== 'string') {
            return;
          }
          const data: unknown = JSON.parse(event.data);
          if (isFlightUpdatesMsg(data)) {
            const flightUpdates = data.flights;
            for (const flight of flightUpdates) {
              this.flights.set(flight.id, flight);
            }
            emit(flightUpdates);
            return;
          }

          if (isInitialStateMsg(data)) {
            this.flights.clear();
            const initialFlights = data.flights;
            for (const flight of initialFlights) {
              this.flights.set(flight.id, flight);
            }
            emit(initialFlights);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        this.connected = false;
        this.notifyStatusChange();

        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(emit);
        }
      };

      this.websocket.onerror = () => {
        this.connected = false;
        this.notifyStatusChange();
      };
    } catch {
      this.connected = false;
      this.notifyStatusChange();
    }
  }

  private scheduleReconnect(emit: (updates: FlightState[]) => void): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    // Silent backoff; telemetry should capture reconnects elsewhere

    setTimeout(() => {
      this.connect(emit);
    }, delay);
  }

  private disconnect(): void {
    if (this.websocket) {
      this.websocket.close(1000, 'Component unmounting');
      this.websocket = null;
    }
    this.connected = false;
    this.notifyStatusChange();
  }

  private notifyStatusChange(): void {
    for (const callback of this.statusCallbacks) {
      callback(this.connected);
    }
  }

  onStatus(callback: (connected: boolean) => void): () => void {
    this.statusCallbacks.add(callback);

    // Immediately call with current status
    callback(this.connected);

    return () => {
      this.statusCallbacks.delete(callback);
    };
  }
}
