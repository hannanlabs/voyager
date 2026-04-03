import PhaseTimeline from "../components/PhaseTimeline";
import CodeBlock from "../components/CodeBlock";

const PARAMS = [
  { param: "Update Frequency", value: "6 Hz", detail: "Physics tick rate" },
  { param: "Broadcast Frequency", value: "2 Hz", detail: "WebSocket GeoJSON pushes" },
  { param: "Initial Flights", value: "50", detail: "Spawned at startup" },
  { param: "Max Flights", value: "2,200", detail: "Dynamic ceiling" },
  { param: "Spawn Interval", value: "5-30s", detail: "Adaptive, scales with count" },
  { param: "Burst Size", value: "5-35", detail: "Flights per spawn event" },
];

const PHASE_RULES = [
  { phase: "Takeoff", color: "#ff7849", condition: "progress < 15%, alt < 15k ft, speed < 15k kts" },
  { phase: "Climb", color: "#ffab40", condition: "progress < 25%, alt < 40k ft" },
  { phase: "Cruise", color: "#00e676", condition: "Default mid-flight phase" },
  { phase: "Descent", color: "#ffca28", condition: "progress > 75%, alt < 45k ft or dist < 200nm" },
  { phase: "Landing", color: "#ff5252", condition: "progress > 90%, alt < 8k ft, dist < 50nm" },
  { phase: "Landed", color: "#607d8b", condition: "dist < 15nm, alt < 500 ft" },
];

const TICK_EXAMPLE = `func (s *Simulator) Start(ctx context.Context) {
    ticker := time.NewTicker(
        time.Second / time.Duration(s.updateHz),
    )
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            s.flights.update()   // physics step
            s.broadcast()        // GeoJSON push @ 2Hz
        }
    }
}`;

export default function SimulatorEngine() {
  return (
    <section id="simulator-engine" className="scroll-mt-24 space-y-8">
      <div>
        <h2 className="text-3xl font-light text-white mb-3">Simulator Engine</h2>
        <p className="text-gray-400 text-lg">
          Go-based physics engine with great-circle navigation and dynamic flight spawning.
        </p>
      </div>

      <PhaseTimeline />

      {/* Phase Rules Table */}
      <div className="bg-white/5 border border-white/[0.08] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Phase
              </th>
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Transition Condition
              </th>
            </tr>
          </thead>
          <tbody>
            {PHASE_RULES.map((rule) => (
              <tr key={rule.phase} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3">
                  <span
                    className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg border"
                    style={{
                      color: rule.color,
                      backgroundColor: `${rule.color}20`,
                      borderColor: `${rule.color}30`,
                    }}
                  >
                    {rule.phase}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-300 font-mono text-xs">
                  {rule.condition}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simulation Parameters */}
      <div className="grid md:grid-cols-3 gap-4">
        {PARAMS.map((p) => (
          <div
            key={p.param}
            className="bg-white/5 border border-white/[0.08] rounded-2xl p-4 text-center"
          >
            <div className="font-mono text-2xl font-bold text-white mb-1">
              {p.value}
            </div>
            <div className="text-sm text-gray-300 font-medium">{p.param}</div>
            <div className="text-xs text-gray-500 mt-1">{p.detail}</div>
          </div>
        ))}
      </div>

      <CodeBlock code={TICK_EXAMPLE} language="go" filename="simulator.go" />
    </section>
  );
}
