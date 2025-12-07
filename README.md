# Voyager

Watch ~2000 planes fly around a 3D globe in real-time.

## What's this?

A flight simulator that generates realistic aircraft movements and streams them to an interactive map. Built to play with Go, WebSockets, and observability tooling. The planes follow great-circle routes between real airports with proper physics (takeoff, climb, cruise, descent, landing).

## Quick Start

**Prerequisites:** Docker, Kubernetes (Docker Desktop works), Tilt, pnpm

```bash
tilt up
```

Open [localhost:3000](http://localhost:3000) for the globe, [localhost:3001](http://localhost:3001) for Grafana dashboards.

## How it works

```
┌──────────────┐    WebSocket (2 Hz)    ┌──────────────┐
│  Simulator   │ ────────────────────── │   Frontend   │
│  (Go)        │    GeoJSON updates     │  (Next.js)   │
└──────────────┘                        └──────────────┘
       │
       │ OTLP
       ▼
┌──────────────────────────────────────────────────────┐
│              Observability Stack                      │
│  Prometheus (metrics) · Tempo (traces) · Loki (logs) │
│                    Grafana                            │
└──────────────────────────────────────────────────────┘
```

- **Simulator** runs at 6 Hz, broadcasts flight positions at 2 Hz
- **Frontend** renders planes on a Mapbox globe, colors by flight phase
- **Observability** - full tracing, metrics, and logs baked in

## Project Structure

```
apps/
  frontend/          # Next.js + React + Mapbox
  simulator/         # Go flight engine
packages/
  shared-go/         # Go domain models
  shared-ts/         # TypeScript schemas (Zod)
infrastructure/      # Prometheus, Loki, Tempo, Grafana, OTEL Collector
deployments/         # Kubernetes manifests
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React 19, Mapbox GL, Tailwind |
| Backend | Go 1.23, Gorilla WebSocket |
| Observability | OpenTelemetry, Prometheus, Tempo, Loki, Grafana |
| Dev | Tilt, Kubernetes, pnpm |

## API

| Endpoint | What it does |
|----------|--------------|
| `ws://localhost:8080/ws/flights` | WebSocket stream of flight positions |
| `GET /geojson/airports` | Airport locations |
| `GET /geojson/flights/route?id=X` | Great-circle route for a flight |
| `GET /healthz` | Health check |
| `GET /readyz` | Readiness check |

## Development

```bash
# Start everything
tilt up

# Stop everything
tilt down

# Frontend only (if running simulator separately)
cd apps/frontend && pnpm dev

# Simulator only
cd apps/simulator && go run ./cmd
```

## Services

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Simulator | 8080 |
| Grafana | 3001 |
| Prometheus | 9090 |
| Tempo | 3200 |
| Loki | 3100 |
