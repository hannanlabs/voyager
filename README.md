# Voyager

Real-time flight simulation. A Go simulator streams flight state as GeoJSON over WebSocket; a Next.js + Mapbox GL frontend renders a 3D globe. Targets ~2000 concurrent flights.

## Quick Start

Using Tilt (runs simulator + frontend with Kubernetes port-forwards):

```bash
tilt up
# Frontend:  http://localhost:3000
# Simulator: http://localhost:8080
```

Frontend requires a Mapbox token. Set it in your environment before starting the frontend (Tilt or local):

```bash
export NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_MAPBOX_TOKEN
```

## Architecture

- Backend (Go): flight simulator at 6 Hz. Dynamic spawn/cleanup, great-circle stepping, basic phase changes (takeoff, climb, cruise, descent, landing, landed). Broadcasts flights as GeoJSON points over WebSocket and exposes simple HTTP endpoints.
- Frontend (Next.js + Mapbox GL): globe view, live flight points, optional route overlay for a selected flight, airport layer.
- Shared Types: Type definitions and small utilities in TypeScript and Go used by both sides.

## Endpoints

- WebSocket: `ws://localhost:8080/ws/flights`
  - Message: `{ type: "flights_geojson", featureCollection, seq, serverTimestamp }`
- HTTP: `GET /geojson/airports` (GeoJSON FeatureCollection)
- HTTP: `GET /geojson/flights/route?id={flightId}&n=128` (LineString FeatureCollection)
- Health: `GET /healthz`, `GET /readyz`

## Configuration

- Simulator env:
  - `PORT` (default `8080`)
  - `UPDATE_HZ` (default `6`)
  - `GEOJSON_FLIGHTS_HZ` (default `2`)
  - `AIRPORTS_GEOJSON_PATH` (default `data/airports.iata.geojson`)
  - `ALLOWED_ORIGINS` (comma-separated; optional)
- Frontend env:
  - `NEXT_PUBLIC_MAPBOX_TOKEN` (required)
  - `NEXT_PUBLIC_FLIGHTS_WS_URL` (e.g. `ws://localhost:8080/ws/flights`)
  - `NEXT_PUBLIC_SIMULATOR_HTTP_URL` (e.g. `http://localhost:8080`)

## Repo Layout

- `apps/simulator` — Go WebSocket/HTTP server and flight engine
- `apps/frontend` — Next.js app with Mapbox GL globe
- `packages/shared-ts` — shared TS types and helpers
- `packages/shared-go` — shared Go types
- `deployments/*` — Kubernetes manifests used by Tilt
- `Tiltfile` — local dev orchestration

This repository demonstrates a simple, scalable real-time streaming pattern with a 3D visualization, matching exactly what’s implemented here.
