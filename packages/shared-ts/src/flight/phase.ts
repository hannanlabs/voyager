import { z } from 'zod';

export const FlightPhaseSchema = z.enum(['takeoff', 'climb', 'cruise', 'descent', 'landing']);