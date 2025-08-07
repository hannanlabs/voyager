import {
  calculateBearing,
  calculateSpeed,
  interpolatePosition,
} from '../../domain/logic/flightMath';

import type { FlightDataSource } from './FlightDataSource';
import type { FlightState } from '../../domain/flight';

const MOCK_FLIGHTS: Omit<
  FlightState,
  'position' | 'bearing' | 'speed' | 'progress' | 'lastComputedAt'
>[] = [
  {
    id: 'UA123',
    callSign: 'UNITED123',
    airline: 'United Airlines',
    departureAirport: 'JFK',
    arrivalAirport: 'LAX',
    phase: 'cruise',
    velocity: { x: 203.5, y: -10.2, z: 0.0 },
    altitude: 35000,
    scheduledDeparture: '2025-08-07T14:00:00Z',
    scheduledArrival: '2025-08-07T18:20:00Z',
    estimatedArrival: '2025-08-07T18:32:00Z',
    traceID: 'f3a9c1e7f12c4d3a9bc2a47db9e30b7c',
  },
  {
    id: 'AA456',
    callSign: 'AMERICAN456',
    airline: 'American Airlines',
    departureAirport: 'LAX',
    arrivalAirport: 'JFK',
    phase: 'cruise',
    velocity: { x: -180.3, y: 8.7, z: 0.1 },
    altitude: 37000,
    scheduledDeparture: '2025-08-07T16:30:00Z',
    scheduledArrival: '2025-08-07T21:45:00Z',
    estimatedArrival: '2025-08-07T21:52:00Z',
    traceID: '9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
  },
  {
    id: 'DL789',
    callSign: 'DELTA789',
    airline: 'Delta Air Lines',
    departureAirport: 'ATL',
    arrivalAirport: 'SEA',
    phase: 'cruise',
    velocity: { x: -120.8, y: 45.2, z: 0.0 },
    altitude: 36000,
    scheduledDeparture: '2025-08-07T13:15:00Z',
    scheduledArrival: '2025-08-07T16:30:00Z',
    estimatedArrival: '2025-08-07T16:28:00Z',
    traceID: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
  },
];

const AIRPORT_COORDS = {
  JFK: { latitude: 40.6413, longitude: -73.7781 },
  LAX: { latitude: 33.9425, longitude: -118.4081 },
  ATL: { latitude: 33.6407, longitude: -84.4277 },
  SEA: { latitude: 47.4502, longitude: -122.3088 },
} as const;

export class MockFlightsSource implements FlightDataSource {
  private flights = new Map<string, FlightState>();
  private intervalId: NodeJS.Timeout | null = null;
  private startTime = Date.now();

  constructor(private updateHz = 6) {
    this.initializeFlights();
  }

  private initializeFlights(): void {
    for (const mockFlight of MOCK_FLIGHTS) {
      const departure = AIRPORT_COORDS[mockFlight.departureAirport as keyof typeof AIRPORT_COORDS];
      const arrival = AIRPORT_COORDS[mockFlight.arrivalAirport as keyof typeof AIRPORT_COORDS];

      const initialProgress = Math.random() * 0.8;
      const position = interpolatePosition(departure, arrival, initialProgress);

      const flight: FlightState = {
        ...mockFlight,
        position: { ...position, altitude: mockFlight.altitude },
        bearing: calculateBearing(
          departure.latitude,
          departure.longitude,
          arrival.latitude,
          arrival.longitude,
        ),
        speed: calculateSpeed(mockFlight.velocity),
        progress: initialProgress,
        lastComputedAt: new Date().toISOString(),
      };

      this.flights.set(flight.id, flight);
    }
  }

  getInitial(): Map<string, FlightState> {
    return new Map(this.flights);
  }

  start(emit: (updates: FlightState[]) => void): () => void {
    this.intervalId = setInterval(() => {
      this.updateFlights();
      emit(Array.from(this.flights.values()));
    }, 1000 / this.updateHz);

    return () => {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    };
  }

  private updateFlights(): void {
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;

    for (const [id, flight] of this.flights) {
      const departure = AIRPORT_COORDS[flight.departureAirport as keyof typeof AIRPORT_COORDS];
      const arrival = AIRPORT_COORDS[flight.arrivalAirport as keyof typeof AIRPORT_COORDS];

      const progressIncrement = 0.0001 * elapsedSeconds;
      const newProgress = Math.min(0.95, flight.progress + progressIncrement);
      const newPosition = interpolatePosition(departure, arrival, newProgress);

      // Determine phase based on progress
      let phase: FlightState['phase'];
      if (newProgress < 0.1) {
        phase = 'takeoff';
      } else if (newProgress < 0.25) {
        phase = 'climb';
      } else if (newProgress < 0.75) {
        phase = 'cruise';
      } else if (newProgress < 0.9) {
        phase = 'descent';
      } else {
        phase = 'landing';
      }

      const updatedFlight: FlightState = {
        ...flight,
        phase,
        position: { ...newPosition, altitude: flight.altitude },
        progress: newProgress,
        lastComputedAt: new Date().toISOString(),
      };

      this.flights.set(id, updatedFlight);
    }
  }

  onStatus(callback: (connected: boolean) => void): () => void {
    setTimeout(() => {
      callback(true);
    }, 100);
    return () => {};
  }
}
