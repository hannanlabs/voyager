import { z } from 'zod';

// Backend flight state schema - matches simulator exactly
const FlightPositionSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  altitude: z.number(),
});

const FlightVelocitySchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const FlightStateSchema = z.object({
  id: z.string(),
  callSign: z.string(),
  airline: z.string(),
  departureAirport: z.string(),
  arrivalAirport: z.string(),
  phase: z.enum(['takeoff', 'climb', 'cruise', 'descent', 'landing']),
  position: FlightPositionSchema,
  velocity: FlightVelocitySchema,
  bearing: z.number(),
  speed: z.number(),
  altitude: z.number(), // Duplicate of position.altitude for compatibility
  progress: z.number().min(0).max(1),
  scheduledDeparture: z.string().datetime(),
  scheduledArrival: z.string().datetime(),
  estimatedArrival: z.string().datetime(),
  lastComputedAt: z.string().datetime(),
  traceID: z.string(),
});

const FlightUpdatesMessageSchema = z.object({
  type: z.literal('flight_updates'),
  flights: z.array(FlightStateSchema),
});

const InitialStateMessageSchema = z.object({
  type: z.literal('initial_state'),
  flights: z.array(FlightStateSchema),
});

const WebSocketMessageSchema = z.discriminatedUnion('type', [
  FlightUpdatesMessageSchema,
  InitialStateMessageSchema,
]);

export type FlightState = z.infer<typeof FlightStateSchema>;
export type FlightPosition = z.infer<typeof FlightPositionSchema>;
export type FlightVelocity = z.infer<typeof FlightVelocitySchema>;
export type FlightUpdatesMessage = z.infer<typeof FlightUpdatesMessageSchema>;
export type InitialStateMessage = z.infer<typeof InitialStateMessageSchema>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

export function validateWebSocketMessage(data: unknown): WebSocketMessage {
  return WebSocketMessageSchema.parse(data);
}