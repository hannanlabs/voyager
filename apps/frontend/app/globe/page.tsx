'use client';

import mapboxgl from 'mapbox-gl';
import { useRef, useEffect, useState, useCallback } from 'react';
import { addAirplaneIcon } from '../components/layers/sprites';
import FlightDetailsSheet from '../components/flightsheet';
import FlightStatusIndicator from '../components/flightstatus';
import { createFlightsPointsLayer, addFlightInteractions } from '../components/layers/flightpoint';
import { createFlightsRoutesLayer, updateRouteVisibility } from '../components/layers/flightroute';
import { createAirportLayers } from '../components/layers/airports';
import { useFlights } from './transport/websocket';
import { addSelectionToGeoJSON, type FlightState, EMPTY_GEOJSON, MAP_CONFIG, MAP_SOURCES, MAP_LAYERS } from '@voyager/shared-ts';
import { getFlightRoute } from './transport/http';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const SIMULATOR_HTTP_URL = process.env.NEXT_PUBLIC_SIMULATOR_HTTP_URL;

export default function Globe() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const mapReady = useRef(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedFlightEnriched, setSelectedFlightEnriched] = useState<FlightState | null>(null);

  const { flights: flightsMap, flightsGeoJSON, flightCount, status } = useFlights();
  const selectedFlight = selectedFlightEnriched ?? (selectedFlightId ? flightsMap.get(selectedFlightId) ?? null : null);

  const processedFlightsGeoJSON = flightsGeoJSON ? addSelectionToGeoJSON(flightsGeoJSON, selectedFlightId) : null;

  const fetchFlightRoute = useCallback(async (flightId: string) => {
    try {
      return await getFlightRoute(flightId);
    } catch (error) {
      console.error('Failed to fetch flight route:', error);
      return EMPTY_GEOJSON;
    }
  }, []);

  const handleFlightClick = useCallback((flightId: string) => {
    setSelectedFlightId(flightId);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedFlightId(null);
    setSelectedFlightEnriched(null);
  }, []);

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

    const setupMapContent = () => {
      addAirplaneIcon(mapInstance);

      mapInstance.addSource(MAP_SOURCES.FLIGHTS_POINTS, { type: 'geojson', data: EMPTY_GEOJSON, promoteId: 'id' });
      mapInstance.addSource(MAP_SOURCES.FLIGHTS_ROUTES, { type: 'geojson', data: EMPTY_GEOJSON });
      mapInstance.addSource(MAP_SOURCES.AIRPORTS, { type: 'geojson', data: `${SIMULATOR_HTTP_URL || ''}/geojson/airports` });

      createFlightsPointsLayer(mapInstance, { sourceId: MAP_SOURCES.FLIGHTS_POINTS, layerId: MAP_LAYERS.FLIGHTS_POINTS });
      addFlightInteractions(mapInstance, { sourceId: MAP_SOURCES.FLIGHTS_POINTS, layerId: MAP_LAYERS.FLIGHTS_POINTS, onFlightClick: handleFlightClick });
      createFlightsRoutesLayer(mapInstance, { sourceId: MAP_SOURCES.FLIGHTS_ROUTES, layerId: MAP_LAYERS.FLIGHTS_ROUTES });

      createAirportLayers(mapInstance);

      mapInstance.on('zoom', () => {
        updateRouteVisibility(mapInstance, MAP_LAYERS.FLIGHTS_ROUTES);
      });

      mapReady.current = true;
    };

    mapInstance.on('load', setupMapContent);
    map.current = mapInstance;

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [handleFlightClick]);

  useEffect(() => {
    if (!map.current || !mapReady.current) return;

    const points = map.current.getSource(MAP_SOURCES.FLIGHTS_POINTS) as mapboxgl.GeoJSONSource;
    if (processedFlightsGeoJSON) {
      points.setData(processedFlightsGeoJSON);
    }
  }, [processedFlightsGeoJSON]);

  useEffect(() => {
    if (!map.current || !mapReady.current) return;

    const updateFlightRoute = async () => {
      const routesSrc = map.current?.getSource(MAP_SOURCES.FLIGHTS_ROUTES) as mapboxgl.GeoJSONSource;
      if (selectedFlightId) {
        const routes = await fetchFlightRoute(selectedFlightId);
        routesSrc.setData(routes);
        
        const baseFlight = flightsMap.get(selectedFlightId);
        if (baseFlight && routes.features.length > 0) {
          const routeFeature = routes.features[0];
          if (routeFeature) {
            const enrichedFlight: FlightState = {
              ...baseFlight,
              departureAirport: routeFeature.properties.departureAirport,
              arrivalAirport: routeFeature.properties.arrivalAirport,
            };
            setSelectedFlightEnriched(enrichedFlight);
          }
        }
      } else {
        routesSrc.setData(EMPTY_GEOJSON);
        setSelectedFlightEnriched(null);
      }
    };

    void updateFlightRoute();
  }, [selectedFlightId, fetchFlightRoute, flightsMap]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />
      
      <FlightStatusIndicator flightCount={flightCount} status={status} />
      
      <FlightDetailsSheet
        flight={selectedFlight}
        isOpen={selectedFlightId !== null}
        onClose={handleCloseDetails}
      />
    </div>
  );
}
