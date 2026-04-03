import type { Map } from "mapbox-gl";
import type { FlightsPointsLayerConfig } from "@/lib/shared";

const PHASE_COLOR_EXPR = [
  "case",
  ["==", ["get", "phase"], "takeoff"],
  "#ff7849",
  ["==", ["get", "phase"], "climb"],
  "#ffab40",
  ["==", ["get", "phase"], "cruise"],
  "#00e676",
  ["==", ["get", "phase"], "descent"],
  "#ffca28",
  ["==", ["get", "phase"], "landing"],
  "#ff5252",
  "#607d8b",
] as mapboxgl.ExpressionSpecification;

export function createFlightsPointsLayer(
  map: Map,
  config: FlightsPointsLayerConfig,
): void {
  const { sourceId, layerId } = config;

  map.addLayer({
    id: layerId,
    type: "symbol",
    source: sourceId,
    layout: {
      "icon-image": "airplane-icon",
      "icon-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        1,
        0.8,
        5,
        1.2,
        10,
        1.8,
        15,
        2.5,
      ],
      "icon-rotate": ["get", "bearing"],
      "icon-rotation-alignment": "map",
      "icon-pitch-alignment": "map",
      "icon-allow-overlap": true,
      "symbol-sort-key": [
        "case",
        ["==", ["get", "phase"], "cruise"],
        3,
        ["==", ["get", "phase"], "climb"],
        2,
        ["==", ["get", "phase"], "descent"],
        2,
        1,
      ],
    },
    paint: {
      "icon-color": [
        "case",
        ["boolean", ["get", "selected"], false],
        "#ffffff",
        PHASE_COLOR_EXPR,
      ],
      "icon-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        1,
        0.75,
        5,
        0.85,
        10,
        1.0,
      ],
      "icon-halo-color": [
        "case",
        ["boolean", ["get", "selected"], false],
        "#ffffff",
        PHASE_COLOR_EXPR,
      ],
      "icon-halo-width": [
        "case",
        ["boolean", ["get", "selected"], false],
        3,
        1.5,
      ],
      "icon-halo-blur": 1,
    },
  });
}

export function addFlightInteractions(
  map: Map,
  config: FlightsPointsLayerConfig,
): void {
  const { layerId, onFlightClick, onFlightHover } = config;

  map.on("click", layerId, (e) => {
    if (!e.features || e.features.length === 0) return;
    const feature = e.features[0];
    const flightId = feature?.properties?.id as string | undefined;
    if (flightId && onFlightClick) {
      onFlightClick(flightId);
    }
  });

  map.on("mouseenter", layerId, (e) => {
    map.getCanvas().style.cursor = "pointer";
    if (!e.features || e.features.length === 0) return;
    const feature = e.features[0];
    const flightId = feature?.properties?.id as string | undefined;
    if (flightId && onFlightHover) {
      onFlightHover(flightId);
    }
  });

  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";

    if (onFlightHover) {
      onFlightHover(null);
    }
  });
}
