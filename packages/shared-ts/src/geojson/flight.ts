export type FlightRouteGeometry =
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'MultiLineString'; coordinates: [number, number][][] };

export type FlightPointFeature = {
  type: 'Feature';
  id: string;
  geometry: { type: 'Point'; coordinates: [number, number, number] };
  properties: {
    id: string;
    callSign: string;
    airline: string;
    phase: import('../flight/state').FlightState['phase'];
    bearing: number;
    speed: number;
    altitude: number;
    progress: number;
    selected?: boolean;
  };
};

export type FlightRouteFeature = {
  type: 'Feature';
  id: string;
  geometry: FlightRouteGeometry;
  properties: {
    id: string;
    callSign: string;
    airline: string;
    departureAirport: string;
    arrivalAirport: string;
    progress: number;
    phase: import('../flight/state').FlightState['phase'];
    selected?: boolean;
  };
};

export type FlightPointsGeoJSON = {
  type: 'FeatureCollection';
  features: FlightPointFeature[];
};

export type FlightRoutesGeoJSON = {
  type: 'FeatureCollection';
  features: FlightRouteFeature[];
};