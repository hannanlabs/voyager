import { z } from 'zod';

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