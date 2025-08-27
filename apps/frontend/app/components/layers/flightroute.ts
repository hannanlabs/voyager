import type { Map } from "mapbox-gl";
import type { FlightsRoutesLayerConfig } from "@voyager/shared-ts";

export function createFlightsRoutesLayer(
  map: Map,
  config: FlightsRoutesLayerConfig,
): void {
  const { sourceId, layerId } = config;

  map.addLayer({
    id: layerId,
    type: "line",
    source: sourceId,
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": [
        "case",
        ["==", ["get", "phase"], "takeoff"],
        "#ff6b35",
        ["==", ["get", "phase"], "climb"],
        "#f7931e",
        ["==", ["get", "phase"], "cruise"],
        "#2ecc71",
        ["==", ["get", "phase"], "descent"],
        "#f39c12",
        ["==", ["get", "phase"], "landing"],
        "#e74c3c",
        "#95a5a6",
      ],
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
        0.4,
        5,
        0.6,
        10,
        0.8,
      ],
    },
  });

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
      "line-color": "#ffffff",
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
  const opacity = Math.min(0.8, Math.max(0.3, (zoom - 2) / 8));

  if (map.getLayer(layerId)) {
    map.setPaintProperty(layerId, "line-opacity", opacity);
  }
}
