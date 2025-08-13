# Voyager

Flight simulation with 2000+ concurrent flights streaming via WebSocket to 3D globe.

## Quick Start

```bash
tilt up
# Frontend: http://localhost:3000
# Simulator: http://localhost:8080
```

## Architecture

**Backend** (Go): Physics-based flight simulator running at 6Hz with realistic flight phases, great circle navigation, and dynamic spawn/cleanup.

**Frontend** (Next.js): 3D Mapbox globe with throttled WebSocket updates, flight tracking, and airport visualization.

**Shared Types**: TypeScript/Go type definitions for WebSocket messages and flight data structures.

## Key Components

- Flight physics with 6-phase model 
- WebSocket streaming with auto-reconnect and backoff
- Performance optimizations for 2000+ flights
- Kubernetes deployment with health checks
- Live development via Tilt with file sync

Built for demonstrating scalable real-time data streaming and 3D visualization patterns.