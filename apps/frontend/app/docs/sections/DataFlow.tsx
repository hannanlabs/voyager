import FlowDiagram from "../components/FlowDiagram";
import CodeBlock from "../components/CodeBlock";

const FLIGHT_STATE_EXAMPLE = `const FlightStateSchema = z.object({
  id: z.string(),
  callSign: z.string(),
  airline: z.string(),
  departureAirport: z.string(),
  arrivalAirport: z.string(),
  phase: FlightPhaseSchema,
  position: FlightPositionSchema,
  velocity: FlightVelocitySchema,
  bearing: z.number(),
  speed: z.number(),
  altitude: z.number(),
  progress: z.number(),
  distanceRemaining: z.number(),
  scheduledDeparture: z.string(),
  scheduledArrival: z.string(),
  estimatedArrival: z.string(),
  lastComputedAt: z.string(),
  traceID: z.string(),
});`;

const PIPELINE_STEPS = [
  {
    title: "Generate",
    description: "Go simulator creates synthetic flights with random airport pairs, airlines, and departure times.",
    detail: "50 initial, scaling to 2,200",
  },
  {
    title: "Compute",
    description: "Physics tick at 6Hz calculates great circle position, bearing, speed, and flight phase.",
    detail: "Great circle interpolation",
  },
  {
    title: "Serialize",
    description: "Flight states packed into GeoJSON FeatureCollection with Point geometries and flight properties.",
    detail: "RFC 7946 compliant",
  },
  {
    title: "Stream",
    description: "WebSocket broadcasts FeatureCollection to all connected clients at 2Hz with sequence numbers.",
    detail: "Auto reconnect on disconnect",
  },
  {
    title: "Validate",
    description: "Frontend validates every message with Zod schemas, ensuring type safety at the boundary.",
    detail: "Runtime type checking",
  },
  {
    title: "Render",
    description: "React Context distributes flight data to Mapbox GL layers for real time 3D globe visualization.",
    detail: "Symbol + line + circle layers",
  },
];

export default function DataFlow() {
  return (
    <section id="data-flow" className="scroll-mt-24 space-y-8">
      <div>
        <h2 className="text-3xl font-light text-white mb-3">Data Flow</h2>
        <p className="text-gray-400 text-lg">
          Synthetic flight data flows from the Go simulator through WebSocket to the Mapbox globe.
        </p>
      </div>

      <FlowDiagram
        steps={[
          { label: "Generate", sublabel: "Go Simulator", color: "#00ADD8" },
          { label: "Serialize", sublabel: "GeoJSON", color: "#607d8b" },
          { label: "Stream", sublabel: "WebSocket", color: "#a855f7" },
          { label: "Validate", sublabel: "Zod Schemas", color: "#3b82f6" },
          { label: "Distribute", sublabel: "React Context", color: "#61dafb" },
          { label: "Render", sublabel: "Mapbox GL", color: "#4264fb" },
        ]}
      />

      {/* Pipeline detail cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PIPELINE_STEPS.map((step, i) => (
          <div
            key={step.title}
            className="bg-white/5 border border-white/[0.08] rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-mono text-white font-bold">
                {i + 1}
              </span>
              <h4 className="text-white font-medium">{step.title}</h4>
            </div>
            <p className="text-gray-400 text-sm mb-2">{step.description}</p>
            <span className="text-xs font-mono text-red-400">{step.detail}</span>
          </div>
        ))}
      </div>

      <CodeBlock
        code={FLIGHT_STATE_EXAMPLE}
        language="typescript"
        filename="lib/shared/flight/state.ts"
      />
    </section>
  );
}
