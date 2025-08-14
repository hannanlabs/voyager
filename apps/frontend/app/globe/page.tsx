'use client';

import mapboxgl from 'mapbox-gl';
import { useRef, useEffect, useState, useCallback } from 'react';
import { addAirplaneIcon } from '../components/layers/sprites';
import FlightDetailsSheet from '../components/flightsheet';
import FlightStatusIndicator from '../components/flightstatus';
import { createFlightsPointsLayer, addFlightInteractions } from '../components/layers/flightpoint';
import { createFlightsRoutesLayer, updateRouteVisibility } from '../components/layers/flightroute';
import { createAirportLayers } from '../components/layers/airports';
import { useFlights } from './websocket';
import { addSelectionToGeoJSON } from './utils';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const SIMULATOR_HTTP_URL = process.env.NEXT_PUBLIC_SIMULATOR_HTTP_URL;

export default function Globe() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const mapReady = useRef(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

  const { flights, flightsGeoJSON, flightCount, status } = useFlights();
  const selectedFlight = selectedFlightId ? flights.get(selectedFlightId) : null;

  const processedFlightsGeoJSON = flightsGeoJSON ? addSelectionToGeoJSON(flightsGeoJSON, selectedFlightId) : null;

  const fetchFlightRoute = useCallback(async (flightId: string) => {
    try {
      const response = await fetch(`${SIMULATOR_HTTP_URL}/geojson/flights/route?id=${flightId}`);
      if (!response.ok) {
        return { type: 'FeatureCollection', features: [] };
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch flight route:', error);
      return { type: 'FeatureCollection', features: [] };
    }
  }, []);

  const handleFlightClick = useCallback((flightId: string) => {
    setSelectedFlightId(flightId);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedFlightId(null);
  }, []);

  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN || map.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      accessToken: MAPBOX_ACCESS_TOKEN,
      style: 'mapbox://styles/mapbox/standard',
      projection: { name: 'globe' },
      center: [0, 20],
      zoom: 1.5,
      pitch: 0,
      bearing: 0,
    });

    mapInstance.dragRotate.enable();
    mapInstance.scrollZoom.enable();
    mapInstance.doubleClickZoom.disable();

    const setupMapContent = () => {
      addAirplaneIcon(mapInstance);

      const emptyGeoJSON = { type: 'FeatureCollection', features: [] };
      mapInstance.addSource('flights-points', { type: 'geojson', data: emptyGeoJSON, promoteId: 'id' });
      mapInstance.addSource('flights-routes', { type: 'geojson', data: emptyGeoJSON });
      mapInstance.addSource('airports', { type: 'geojson', data: `${SIMULATOR_HTTP_URL}/geojson/airports` });

      createFlightsPointsLayer(mapInstance, { sourceId: 'flights-points', layerId: 'flights-points-layer' });
      addFlightInteractions(mapInstance, { sourceId: 'flights-points', layerId: 'flights-points-layer', onFlightClick: handleFlightClick });
      createFlightsRoutesLayer(mapInstance, { sourceId: 'flights-routes', layerId: 'flights-routes-layer' });

      createAirportLayers(mapInstance);

      mapInstance.on('zoom', () => {
        updateRouteVisibility(mapInstance, 'flights-routes-layer');
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

    const points = map.current.getSource('flights-points') as mapboxgl.GeoJSONSource | undefined;
    if (points && processedFlightsGeoJSON) {
      points.setData(processedFlightsGeoJSON);
    }
  }, [processedFlightsGeoJSON]);

  useEffect(() => {
    if (!map.current || !mapReady.current) return;

    const updateFlightRoute = async () => {
      const routesSrc = map.current?.getSource('flights-routes') as mapboxgl.GeoJSONSource | undefined;
      if (routesSrc) {
        if (selectedFlightId) {
          const routes = await fetchFlightRoute(selectedFlightId);
          routesSrc.setData(routes);
        } else {
          routesSrc.setData({ type: 'FeatureCollection', features: [] });
        }
      }
    };

    updateFlightRoute();
  }, [selectedFlightId, fetchFlightRoute]);

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
