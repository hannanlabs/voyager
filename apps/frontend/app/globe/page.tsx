'use client';

import mapboxgl from 'mapbox-gl';
import { useRef, useEffect, useState, useCallback } from 'react';
import { addAirplaneIcon } from '../components/layers/sprites';
import FlightDetailsSheet from '../components/flightsheet';
import { createFlightsPointsLayer, addFlightInteractions } from '../components/layers/flightpoint';
import { createFlightsRoutesLayer, updateRouteVisibility } from '../components/layers/flightroute';
import { createAirportLayers } from '../components/layers/airports';
import { useFlights } from './websocket';
import { toFlightPointsGeoJSON, toFlightRoutesGeoJSON } from '../components/layers/geojson';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Globe() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const mapReady = useRef(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

  const { flights, status } = useFlights();
  const selectedFlight = selectedFlightId ? flights.get(selectedFlightId) : null;

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
      mapInstance.addSource('airports', { type: 'geojson', data: '/data/airports.iata.geojson' });

      createFlightsPointsLayer(mapInstance, { sourceId: 'flights-points', layerId: 'flights-points-layer', onFlightClick: handleFlightClick });
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
    points?.setData(toFlightPointsGeoJSON(flights.values(), selectedFlightId));

    toFlightRoutesGeoJSON(flights.values(), selectedFlightId).then((routes) => {
      const routesSrc = map.current?.getSource('flights-routes') as mapboxgl.GeoJSONSource | undefined;
      routesSrc?.setData(routes);
    }).catch(() => {});
  }, [flights, selectedFlightId]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />
      
      <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-mono text-lg font-bold">
            {flights.size.toLocaleString()} flights
          </span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          {status === 'open' ? 'Live' : 'Disconnected'}
        </div>
      </div>
      
      <FlightDetailsSheet
        flight={selectedFlight}
        isOpen={selectedFlightId !== null}
        onClose={handleCloseDetails}
      />
    </div>
  );
}
