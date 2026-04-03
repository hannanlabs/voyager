import FlowDiagram from "../components/FlowDiagram";

const METRICS = [
  { name: "active_flights", type: "Gauge", description: "Total active flights in simulation" },
  { name: "websocket_connections", type: "Counter", description: "Active WebSocket client connections" },
  { name: "process_resident_memory_bytes", type: "Gauge", description: "Simulator process memory usage" },
  { name: "process_cpu_seconds_total", type: "Counter", description: "Cumulative CPU time consumed" },
  { name: "go_goroutines", type: "Gauge", description: "Number of active goroutines" },
];

const SERVICES = [
  { name: "Frontend", port: "3000", protocol: "HTTP" },
  { name: "Simulator", port: "8080", protocol: "HTTP/WS" },
  { name: "OTEL Collector", port: "4317 / 4318", protocol: "gRPC / HTTP" },
  { name: "Prometheus", port: "9090", protocol: "HTTP" },
  { name: "Loki", port: "3100", protocol: "HTTP" },
  { name: "Tempo", port: "3200", protocol: "gRPC" },
  { name: "Grafana", port: "3001", protocol: "HTTP" },
];

export default function Observability() {
  return (
    <section id="observability" className="scroll-mt-24 space-y-8">
      <div>
        <h2 className="text-3xl font-light text-white mb-3">Observability</h2>
        <p className="text-gray-400 text-lg">
          Full telemetry pipeline with traces, metrics, and logs via OpenTelemetry.
        </p>
      </div>

      {/* OTEL Pipeline */}
      <div className="space-y-4">
        <FlowDiagram
          title="Traces Pipeline"
          steps={[
            { label: "OTLP SDK", sublabel: "Go + Browser", color: "#a855f7" },
            { label: "OTEL Collector", sublabel: "Batch processor", color: "#f5a623" },
            { label: "Tempo", sublabel: "Trace storage", color: "#f43e5c" },
            { label: "Grafana", sublabel: "Trace explorer", color: "#ff9830" },
          ]}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <FlowDiagram
            title="Metrics Pipeline"
            steps={[
              { label: "OTLP", color: "#f5a623" },
              { label: "Collector", color: "#f5a623" },
              { label: "Prometheus", sublabel: ":9090", color: "#e6522c" },
            ]}
          />
          <FlowDiagram
            title="Logs Pipeline"
            steps={[
              { label: "OTLP", color: "#f5a623" },
              { label: "Collector", color: "#f5a623" },
              { label: "Loki", sublabel: ":3100", color: "#f59e0b" },
            ]}
          />
        </div>
      </div>

      {/* Prometheus Metrics Table */}
      <div className="bg-white/5 border border-white/[0.08] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Metric
              </th>
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Type
              </th>
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs hidden md:table-cell">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => (
              <tr key={m.name} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3 font-mono text-emerald-400 text-xs">
                  {m.name}
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-mono bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                    {m.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400 hidden md:table-cell">
                  {m.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Service Ports Table */}
      <div className="bg-white/5 border border-white/[0.08] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Service
              </th>
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Port
              </th>
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Protocol
              </th>
            </tr>
          </thead>
          <tbody>
            {SERVICES.map((s) => (
              <tr key={s.name} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3 text-white font-medium">{s.name}</td>
                <td className="px-5 py-3 font-mono text-emerald-400">{s.port}</td>
                <td className="px-5 py-3 text-gray-400">{s.protocol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trace ID note */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <div>
            <h4 className="text-purple-300 font-medium text-sm mb-1">
              Distributed Trace Correlation
            </h4>
            <p className="text-gray-400 text-sm">
              Each flight carries a <code className="font-mono text-purple-300 bg-white/5 px-1.5 py-0.5 rounded">traceID</code> field,
              enabling end-to-end correlation from the simulator&apos;s physics loop through WebSocket delivery to frontend rendering.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
