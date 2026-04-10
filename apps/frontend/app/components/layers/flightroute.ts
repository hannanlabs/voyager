import type { Map } from "mapbox-gl";
import type { FlightsRoutesLayerConfig } from "@/lib/shared";

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

export function createFlightsRoutesLayer(
  map: Map,
  config: FlightsRoutesLayerConfig,
): void {
  const { sourceId, layerId } = config;

  // Glow layer — wider, blurred, beneath the main line
  map.addLayer({
    id: `${layerId}-glow`,
    type: "line",
    source: sourceId,
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": PHASE_COLOR_EXPR,
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        1,
        3,
        5,
        6,
        10,
        9,
        15,
        12,
      ],
      "line-opacity": 0.15,
      "line-blur": 4,
    },
  });

  // Main route line
  map.addLayer({
    id: layerId,
    type: "line",
    source: sourceId,
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": PHASE_COLOR_EXPR,
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        1,
        1,
        5,
        2,
        10,
        3,
        15,
        4,
      ],
      "line-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        1,
        0.6,
        5,
        0.8,
        10,
        0.95,
      ],
    },
  });

  // Selected route glow
  map.addLayer({
    id: `${layerId}-selected-glow`,
    type: "line",
    source: sourceId,
    filter: ["==", ["get", "selected"], true],
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#ffffff",
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        1,
        9,
        5,
        11,
        10,
        13,
        15,
        15,
      ],
      "line-opacity": 0.25,
      "line-blur": 6,
    },
  });

  // Selected route line
  map.addLayer({
    id: `${layerId}-selected`,
    type: "line",
    source: sourceId,
    filter: ["==", ["get", "selected"], true],
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#e0e0ff",
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        1,
        3,
        5,
        5,
        10,
        7,
        15,
        9,
      ],
      "line-opacity": 0.9,
    },
  });
}

export function updateRouteVisibility(map: Map, layerId: string): void {
  const zoom = map.getZoom();
  const opacity = Math.min(0.95, Math.max(0.4, (zoom - 2) / 6));

  if (map.getLayer(layerId)) {
    map.setPaintProperty(layerId, "line-opacity", opacity);
  }
  if (map.getLayer(`${layerId}-glow`)) {
    map.setPaintProperty(`${layerId}-glow`, "line-opacity", opacity * 0.2);
  }
}
