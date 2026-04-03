import EndpointRow from "../components/EndpointRow";
import CodeBlock from "../components/CodeBlock";

const WS_EXAMPLE = `{
  "type": "flights_geojson",
  "featureCollection": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [-73.778, 40.639, 35000]
        },
        "properties": {
          "id": "UAL1-JFK-LAX",
          "callSign": "UAL1",
          "airline": "United",
          "phase": "cruise",
          "bearing": 265.4,
          "speed": 30000,
          "altitude": 35000,
          "progress": 0.65
        }
      }
    ]
  },
  "seq": 1234,
  "serverTimestamp": 1712181234567
}`;

const ROUTE_EXAMPLE = `{
  "type": "Feature",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-73.778, 40.639], [-78.2, 40.1],
      [-84.5, 38.7],    [-90.1, 37.2],
      ...
      [-118.408, 33.942]
    ]
  },
  "properties": {
    "id": "UAL1-JFK-LAX"
  }
}`;

export default function ApiReference() {
  return (
    <section id="api-reference" className="scroll-mt-24 space-y-8">
      <div>
        <h2 className="text-3xl font-light text-white mb-3">API Reference</h2>
        <p className="text-gray-400 text-lg">
          Simulator exposes WebSocket and REST endpoints on port 8080.
        </p>
      </div>

      <div className="space-y-4">
        <EndpointRow
          method="WS"
          path="/ws/flights"
          description="Real-time flight positions streamed as GeoJSON FeatureCollection at 2Hz. Each feature includes position, phase, velocity, bearing, and progress."
        >
          <CodeBlock
            code={WS_EXAMPLE}
            language="json"
            filename="WebSocket Message"
          />
        </EndpointRow>

        <EndpointRow
          method="GET"
          path="/geojson/airports"
          description="Static GeoJSON FeatureCollection of 1500+ airports with IATA codes, coordinates, and airport type. Cached with Cache-Control headers."
        />

        <EndpointRow
          method="GET"
          path="/geojson/flights/route?id={flightId}&n=128"
          description="Returns a great-circle route as a GeoJSON LineString with n interpolated points between departure and arrival airports."
        >
          <div className="mt-2">
            <div className="flex gap-4 mb-3">
              <div className="bg-white/5 rounded-xl px-3 py-2 text-xs">
                <span className="text-gray-400">id</span>
                <span className="text-white ml-2 font-mono">string</span>
                <span className="text-gray-500 ml-2">Flight identifier</span>
              </div>
              <div className="bg-white/5 rounded-xl px-3 py-2 text-xs">
                <span className="text-gray-400">n</span>
                <span className="text-white ml-2 font-mono">int</span>
                <span className="text-gray-500 ml-2">Route detail points (default 128)</span>
              </div>
            </div>
            <CodeBlock
              code={ROUTE_EXAMPLE}
              language="json"
              filename="Response"
            />
          </div>
        </EndpointRow>

        <div className="grid md:grid-cols-2 gap-4">
          <EndpointRow
            method="GET"
            path="/healthz"
            description="Liveness probe. Returns 200 OK when the simulator process is running."
          />
          <EndpointRow
            method="GET"
            path="/readyz"
            description="Readiness probe. Returns 200 OK when the simulator is ready to accept connections."
          />
        </div>

        <EndpointRow
          method="POST"
          path="/api/traces"
          description="Frontend telemetry relay. Forwards OpenTelemetry trace spans to the OTEL Collector at otel-collector:4318."
        />
      </div>
    </section>
  );
}
