"use client";

import mapboxgl from "mapbox-gl";
import { useRef, useEffect, useState } from "react";
import { addAirplaneIcon } from "../components/layers/sprites";
import FlightDetailsSheet from "../components/flightsheet";
import FlightStatusIndicator from "../components/flightstatus";
import {
  createFlightsPointsLayer,
  addFlightInteractions,
} from "../components/layers/flightpoint";
import {
  createFlightsRoutesLayer,
  updateRouteVisibility,
} from "../components/layers/flightroute";
import { createAirportLayers } from "../components/layers/airports";
import { useFlights } from "./transport/websocket";
import {
  addSelectionToGeoJSON,
  type FlightState,
  EMPTY_GEOJSON,
  MAP_CONFIG,
  MAP_SOURCES,
  MAP_LAYERS,
} from "@voyager/shared-ts";
import { loadFlightRoute, getAirportsUrl } from "./transport/http";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Globe() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const mapReady = useRef(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightState | null>(
    null,
  );

  const { flights, flightsGeoJSON, status } = useFlights();

  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN || map.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current as HTMLDivElement,
      accessToken: MAPBOX_ACCESS_TOKEN,
      style: MAP_CONFIG.STYLE,
      projection: MAP_CONFIG.PROJECTION,
      center: MAP_CONFIG.CENTER,
      zoom: MAP_CONFIG.ZOOM,
      pitch: MAP_CONFIG.PITCH,
      bearing: MAP_CONFIG.BEARING,
    });

    mapInstance.dragRotate.enable();
    mapInstance.scrollZoom.enable();
    mapInstance.doubleClickZoom.disable();

    mapInstance.on("load", () => {
      addAirplaneIcon(mapInstance);

      mapInstance.addSource(MAP_SOURCES.FLIGHTS_POINTS, {
        type: "geojson",
        data: EMPTY_GEOJSON,
        promoteId: "id",
      });
      mapInstance.addSource(MAP_SOURCES.FLIGHTS_ROUTES, {
        type: "geojson",
        data: EMPTY_GEOJSON,
      });
      mapInstance.addSource(MAP_SOURCES.AIRPORTS, {
        type: "geojson",
        data: getAirportsUrl(),
      });

      createFlightsPointsLayer(mapInstance, {
        sourceId: MAP_SOURCES.FLIGHTS_POINTS,
        layerId: MAP_LAYERS.FLIGHTS_POINTS,
      });
      addFlightInteractions(mapInstance, {
        sourceId: MAP_SOURCES.FLIGHTS_POINTS,
        layerId: MAP_LAYERS.FLIGHTS_POINTS,
        onFlightClick: setSelectedFlightId,
      });
      createFlightsRoutesLayer(mapInstance, {
        sourceId: MAP_SOURCES.FLIGHTS_ROUTES,
        layerId: MAP_LAYERS.FLIGHTS_ROUTES,
      });

      createAirportLayers(mapInstance);

      mapInstance.on("zoom", () => {
        updateRouteVisibility(mapInstance, MAP_LAYERS.FLIGHTS_ROUTES);
      });

      mapReady.current = true;
    });
    map.current = mapInstance;

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapReady.current || !flightsGeoJSON) return;

    const points = map.current.getSource(
      MAP_SOURCES.FLIGHTS_POINTS,
    ) as mapboxgl.GeoJSONSource;
    points.setData(addSelectionToGeoJSON(flightsGeoJSON, selectedFlightId));
  }, [flightsGeoJSON, selectedFlightId]);

  useEffect(() => {
    if (!map.current || !mapReady.current) return;

    const routesSrc = map.current.getSource(
      MAP_SOURCES.FLIGHTS_ROUTES,
    ) as mapboxgl.GeoJSONSource;

    if (!selectedFlightId) {
      routesSrc.setData(EMPTY_GEOJSON);
      setSelectedFlight(null);
      return;
    }

    void loadFlightRoute(
      selectedFlightId,
      routesSrc,
      flights,
      setSelectedFlight,
    );
  }, [selectedFlightId, flights]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />

      <FlightStatusIndicator flightCount={flights.size} status={status} />

      <FlightDetailsSheet
        flight={selectedFlight}
        isOpen={selectedFlightId !== null}
        onClose={() => {
          setSelectedFlightId(null);
          setSelectedFlight(null);
        }}
      />
    </div>
  );
}
