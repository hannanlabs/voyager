import { z } from 'zod';
import { FlightStateSchema } from '../flight/state';

export const FlightUpdatesMessageSchema = z.object({
  type: z.literal('flight_updates'),
  flights: z.array(FlightStateSchema),
});

export const InitialStateMessageSchema = z.object({
  type: z.literal('initial_state'),
  flights: z.array(FlightStateSchema),
});

export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  FlightUpdatesMessageSchema,
  InitialStateMessageSchema,
]);

export type FlightUpdatesMessage = z.infer<typeof FlightUpdatesMessageSchema>;
export type InitialStateMessage = z.infer<typeof InitialStateMessageSchema>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;