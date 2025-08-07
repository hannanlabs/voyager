'use client';

import mapboxgl from 'mapbox-gl';
import { useRef, useEffect, useState, useCallback } from 'react';

import { addAirplaneIcon } from '../adapters/mapbox/sprites';
import FlightDetailsSheet from '../components/FlightDetailsSheet';
import {
  createFlightsPointsLayer,
  addFlightInteractions,
} from '../components/layers/FlightsPointsLayer';
import {
  createFlightsRoutesLayer,
  updateRouteVisibility,
} from '../components/layers/FlightsRoutesLayer';
import { useFlights } from '../data/useFlights';
import { toFlightPointsGeoJSON, toFlightRoutesGeoJSON } from '../domain/geojson';

import type { JSX } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Globe(): JSX.Element {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

  const { flights, connected } = useFlights({ updateHz: 6 });
  const selectedFlight = selectedFlightId ? (flights.get(selectedFlightId) ?? null) : null;

  const handleFlightClick = useCallback((flightId: string) => {
    setSelectedFlightId(flightId);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedFlightId(null);
  }, []);

  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN || map.current) return;

    const containerEl = mapContainer.current;
    if (!containerEl) return;

    const mapInstance = new mapboxgl.Map({
      container: containerEl,
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
      // Set fog effects
      mapInstance.setFog({
        range: [1, 15],
        color: '#d9d9e6',
        'horizon-blend': 0.1,
      });

      // Add airplane icon
      addAirplaneIcon(mapInstance);

      // Add sources with empty initial data; they will be populated by the update effect
      mapInstance.addSource('flights-points', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        promoteId: 'id',
      });

      mapInstance.addSource('flights-routes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Add layers
      createFlightsPointsLayer(mapInstance, {
        sourceId: 'flights-points',
        layerId: 'flights-points-layer',
        onFlightClick: handleFlightClick,
      });

      addFlightInteractions(mapInstance, {
        sourceId: 'flights-points',
        layerId: 'flights-points-layer',
        onFlightClick: handleFlightClick,
      });

      createFlightsRoutesLayer(mapInstance, {
        sourceId: 'flights-routes',
        layerId: 'flights-routes-layer',
      });

      // Add zoom listener for route visibility
      mapInstance.on('zoom', () => {
        updateRouteVisibility(mapInstance, 'flights-routes-layer');
      });
    };

    mapInstance.on('load', setupMapContent);
    map.current = mapInstance;

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [handleFlightClick]);

  useEffect(() => {
    if (!map.current?.isStyleLoaded()) return;

    const pointsSource = map.current.getSource('flights-points');
    const routesSource = map.current.getSource('flights-routes');

    if (pointsSource && 'setData' in pointsSource) {
      pointsSource.setData(toFlightPointsGeoJSON(flights.values(), selectedFlightId));
    }

    if (routesSource && 'setData' in routesSource) {
      routesSource.setData(toFlightRoutesGeoJSON(flights.values(), selectedFlightId));
    }
  }, [flights, selectedFlightId]);

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Mapbox Token Required</h2>
          <p className="text-gray-300">
            Please add your Mapbox access token to NEXT_PUBLIC_MAPBOX_TOKEN environment variable.
          </p>
          <p className="text-gray-400 mt-2 text-sm">
            You can get a token at{' '}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      <div className="absolute top-4 right-4 px-3 py-2 rounded-lg bg-black/50 text-white text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>
            {flights.size} flights {connected ? '(connected)' : '(disconnected)'}
          </span>
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
