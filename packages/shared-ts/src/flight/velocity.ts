import { z } from 'zod';

export const FlightVelocitySchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export type FlightVelocity = z.infer<typeof FlightVelocitySchema>;