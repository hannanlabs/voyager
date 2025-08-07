export type FlightPosition = {
  latitude: number;
  longitude: number;
  altitude: number;
};

export type FlightVelocity = {
  x: number;
  y: number;
  z: number;
};

export type FlightState = {
  id: string;
  callSign: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  phase: 'takeoff' | 'climb' | 'cruise' | 'descent' | 'landing';
  position: FlightPosition;
  velocity: FlightVelocity;
  bearing: number;
  speed: number;
  altitude: number;
  progress: number;
  scheduledDeparture: string;
  scheduledArrival: string;
  estimatedArrival: string;
  lastComputedAt: string;
  traceID: string;
};

export type FlightUpdates = Map<string, FlightState>;
