import type { Map } from "mapbox-gl";

export function createAirportLayers(map: Map): void {
  const filter = ["==", ["get", "type"], "large_airport"];

  map.addLayer({
    id: "airports-large",
    type: "circle",
    source: "airports",
    filter,
    paint: {
      "circle-color": "rgba(255, 255, 255, 0.1)",
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        3,
        6,
        7,
        12,
        11,
      ],
      "circle-stroke-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        1,
        12,
        1.5,
      ],
      "circle-stroke-color": "#a0aec0",
      "circle-opacity": 0.9,
      "circle-blur": 0.5,
    },
    minzoom: 4,
  });

  map.addLayer({
    id: "airports-large-labels",
    type: "symbol",
    source: "airports",
    filter,
    layout: {
      "text-field": ["get", "iata"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 5, 10, 12, 14],
      "text-offset": [0, 1.5],
      "text-anchor": "top",
      "text-optional": true,
    },
    paint: {
      "text-color": "#e2e8f0",
      "text-halo-color": "rgba(0, 0, 0, 0.8)",
      "text-halo-width": 2,
    },
    minzoom: 5,
  });
}
