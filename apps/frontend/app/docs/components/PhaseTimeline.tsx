const PHASES = [
  { name: "Takeoff", color: "#ff7849" },
  { name: "Climb", color: "#ffab40" },
  { name: "Cruise", color: "#00e676" },
  { name: "Descent", color: "#ffca28" },
  { name: "Landing", color: "#ff5252" },
  { name: "Landed", color: "#607d8b" },
] as const;

export default function PhaseTimeline() {
  return (
    <div className="bg-white/5 border border-white/[0.08] rounded-2xl p-6">
      <h4 className="text-gray-300 text-sm uppercase tracking-wider font-medium mb-6">
        Flight Lifecycle
      </h4>
      <div className="flex items-center gap-0">
        {PHASES.map((phase, i) => (
          <div key={phase.name} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center w-full">
              <div
                className="w-4 h-4 rounded-full border-2 shrink-0"
                style={{
                  borderColor: phase.color,
                  backgroundColor: `${phase.color}30`,
                  boxShadow: `0 0 8px ${phase.color}40`,
                }}
              />
              <span
                className="text-xs font-medium mt-2 whitespace-nowrap"
                style={{ color: phase.color }}
              >
                {phase.name}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div
                className="h-0.5 flex-1 min-w-4 -mt-5"
                style={{
                  background: `linear-gradient(to right, ${phase.color}60, ${PHASES[i + 1].color}60)`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
