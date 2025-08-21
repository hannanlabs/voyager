import { z } from 'zod';

export type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

export const WS_STATUS = {
  CONNECTING: 'connecting',
  OPEN: 'open', 
  CLOSED: 'closed',
  ERROR: 'error'
} as const;

export const FlightsGeoJSONMessageSchema = z.object({
  type: z.literal('flights_geojson'),
  featureCollection: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(z.any()),
  }),
  seq: z.number(),
  serverTimestamp: z.number(),
});

export const WebSocketMessageSchema = FlightsGeoJSONMessageSchema;

export type FlightsGeoJSONMessage = z.infer<typeof FlightsGeoJSONMessageSchema>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

export function validateWebSocketMessage(data: unknown): WebSocketMessage {
  return WebSocketMessageSchema.parse(data);
}