import { z } from 'zod';
import type { FlightRoutesGeoJSON } from '../utility/geojson';

export const PointGeometrySchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]).or(z.tuple([z.number(), z.number(), z.number()])),
});

export const LineStringGeometrySchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()]).or(z.tuple([z.number(), z.number(), z.number()]))),
});

export const MultiLineStringGeometrySchema = z.object({
  type: z.literal('MultiLineString'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]).or(z.tuple([z.number(), z.number(), z.number()])))),
});

export const FlightRouteGeometrySchema = z.union([
  LineStringGeometrySchema,
  MultiLineStringGeometrySchema,
]);

export const FlightRoutePropertiesSchema = z.union([
  z.object({
    id: z.string(),
    callSign: z.string(),
    airline: z.string().optional(),
    from: z.string(),
    to: z.string(),
    progress: z.number().optional(),
    phase: z.enum(['takeoff', 'climb', 'cruise', 'descent', 'landing', 'landed']).optional(),
    selected: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    callSign: z.string(),
    airline: z.string().optional(),
    departureAirport: z.string(),
    arrivalAirport: z.string(),
    progress: z.number().optional(),
    phase: z.enum(['takeoff', 'climb', 'cruise', 'descent', 'landing', 'landed']).optional(),
    selected: z.boolean().optional(),
  }),
]);

export const FlightRouteFeatureSchema = z.object({
  type: z.literal('Feature'),
  id: z.string().optional(),
  geometry: FlightRouteGeometrySchema,
  properties: FlightRoutePropertiesSchema,
});

export const FlightRoutesGeoJSONSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(FlightRouteFeatureSchema),
});

export const AirportFeatureSchema = z.object({
  type: z.literal('Feature'),
  id: z.string().or(z.number()).optional(),
  geometry: PointGeometrySchema,
  properties: z.record(z.unknown()), 
});

export const AirportsGeoJSONSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(AirportFeatureSchema),
});

export const FlightRouteQuerySchema = z.object({
  id: z.string().min(1, 'Flight ID is required'),
  n: z.number().int().positive().optional().default(128),
});

export type AirportFeature = z.infer<typeof AirportFeatureSchema>;
export type AirportsGeoJSON = z.infer<typeof AirportsGeoJSONSchema>;
export type FlightRouteQuery = z.infer<typeof FlightRouteQuerySchema>;

export type { FlightRouteGeometry, FlightRouteFeature, FlightRoutesGeoJSON } from '../utility/geojson';

export function normalizeFlightRouteProperties(
  properties: z.infer<typeof FlightRoutePropertiesSchema>
): {
  id: string;
  callSign: string;
  airline?: string;
  departureAirport: string;
  arrivalAirport: string;
  progress?: number;
  phase?: 'takeoff' | 'climb' | 'cruise' | 'descent' | 'landing' | 'landed';
  selected?: boolean;
} {
  if ('from' in properties && 'to' in properties) {
    return {
      id: properties.id,
      callSign: properties.callSign,
      airline: properties.airline,
      departureAirport: properties.from,
      arrivalAirport: properties.to,
      progress: properties.progress,
      phase: properties.phase,
      selected: properties.selected,
    };
  }
  return properties;
}

export function validateFlightRouteQuery(input: unknown): FlightRouteQuery {
  return FlightRouteQuerySchema.parse(input);
}

export function validateFlightRouteResponse(input: unknown): FlightRoutesGeoJSON {
  const result = FlightRoutesGeoJSONSchema.parse(input);
  
  return {
    ...result,
    features: result.features.map(feature => ({
      ...feature,
      properties: normalizeFlightRouteProperties(feature.properties),
    })),
  };
}

export function validateAirportsResponse(input: unknown): AirportsGeoJSON {
  return AirportsGeoJSONSchema.parse(input);
}