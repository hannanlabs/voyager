import { z } from 'zod';

export const FlightPositionSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  altitude: z.number(),
});

export type FlightPosition = z.infer<typeof FlightPositionSchema>;