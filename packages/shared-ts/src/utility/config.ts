export type FlightsPointsLayerConfig = {
  sourceId: string;
  layerId: string;
  onFlightClick?: (flightId: string) => void;
  onFlightHover?: (flightId: string | null) => void;
};

export type FlightsRoutesLayerConfig = {
  sourceId: string;
  layerId: string;
};