import FlowDiagram from "../components/FlowDiagram";

const STACK = [
  { category: "Backend", tech: "Go 1.23", detail: "Gorilla WebSocket, OpenTelemetry" },
  { category: "Frontend", tech: "Next.js 15 + React 19", detail: "Mapbox GL, Zod, Tailwind CSS" },
  { category: "Platform", tech: "Kubernetes", detail: "Tilt for local dev, Helm charts" },
  { category: "Observability", tech: "OpenTelemetry", detail: "Prometheus, Loki, Tempo, Grafana" },
  { category: "Geospatial", tech: "Mapbox GL JS", detail: "3D globe projection, GeoJSON layers" },
  { category: "Streaming", tech: "WebSocket", detail: "2Hz GeoJSON broadcast, auto reconnect" },
];

export default function ArchitectureOverview() {
  return (
    <section id="architecture" className="scroll-mt-24 space-y-8">
      <div>
        <h2 className="text-3xl font-light text-white mb-3">Architecture Overview</h2>
        <p className="text-gray-400 text-lg">
          End to end system design from simulation engine to real time visualization.
        </p>
      </div>

      {/* System Diagram */}
      <FlowDiagram
        title="Core Pipeline"
        steps={[
          { label: "Go Simulator", sublabel: "6Hz physics loop", color: "#00ADD8" },
          { label: "GeoJSON", sublabel: "FeatureCollection", color: "#607d8b" },
          { label: "WebSocket", sublabel: "2Hz broadcast", color: "#a855f7" },
          { label: "React Context", sublabel: "Zod validation", color: "#61dafb" },
          { label: "Mapbox GL", sublabel: "3D globe render", color: "#4264fb" },
        ]}
      />

      <FlowDiagram
        title="Observability Pipeline"
        steps={[
          { label: "OTLP SDK", sublabel: "Traces + Metrics + Logs", color: "#f5a623" },
          { label: "OTEL Collector", sublabel: "gRPC :4317", color: "#f5a623" },
          { label: "Prometheus", sublabel: "Metrics :9090", color: "#e6522c" },
          { label: "Tempo", sublabel: "Traces :3200", color: "#f43e5c" },
          { label: "Grafana", sublabel: "Dashboards :3001", color: "#ff9830" },
        ]}
      />

      {/* Tech Stack Table */}
      <div className="bg-white/5 border border-white/[0.08] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Layer
              </th>
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Technology
              </th>
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs hidden md:table-cell">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {STACK.map((row) => (
              <tr key={row.category} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3 text-white font-medium">{row.category}</td>
                <td className="px-5 py-3 font-mono text-red-400">{row.tech}</td>
                <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
