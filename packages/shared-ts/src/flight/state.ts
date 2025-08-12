import { z } from 'zod';
import { FlightPositionSchema } from './position';
import { FlightVelocitySchema } from './velocity';
import { FlightPhaseSchema } from './phase';

export const FlightStateSchema = z.object({
  id: z.string(),
  callSign: z.string(),
  airline: z.string(),
  departureAirport: z.string(),
  arrivalAirport: z.string(),
  phase: FlightPhaseSchema,
  position: FlightPositionSchema,
  velocity: FlightVelocitySchema,
  bearing: z.number(),
  speed: z.number(),
  altitude: z.number(), // Duplicate of position.altitude for compatibility
  progress: z.number().min(0).max(1),
  distanceRemaining: z.number().min(0),
  scheduledDeparture: z.string().datetime(),
  scheduledArrival: z.string().datetime(),
  estimatedArrival: z.string().datetime(),
  lastComputedAt: z.string().datetime(),
  traceID: z.string(),
});

export type FlightState = z.infer<typeof FlightStateSchema>;