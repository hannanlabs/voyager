// Re-export types from shared schema for backward compatibility
export type { 
  FlightState, 
  FlightPosition, 
  FlightVelocity 
} from '@voyager/shared-ts';

import type { FlightState } from '@voyager/shared-ts';

export type FlightUpdates = Map<string, FlightState>;
