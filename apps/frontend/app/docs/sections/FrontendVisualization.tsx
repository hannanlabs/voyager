const PHASE_COLORS = [
  { phase: "Takeoff", color: "#ff7849" },
  { phase: "Climb", color: "#ffab40" },
  { phase: "Cruise", color: "#00e676" },
  { phase: "Descent", color: "#ffca28" },
  { phase: "Landing", color: "#ff5252" },
  { phase: "Unknown", color: "#607d8b" },
];

const LAYERS = [
  {
    name: "Flight Points",
    type: "Symbol",
    source: "flights-points",
    description:
      "Canvas-generated airplane sprites rendered as SDF icons. Rotated by bearing, colored by flight phase, sized dynamically with zoom level (0.8x at zoom 1, 2.5x at zoom 15).",
    icon: (
      <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    ),
  },
  {
    name: "Flight Routes",
    type: "Line",
    source: "flights-routes",
    description:
      "Great-circle paths rendered as colored lines with a glow sub-layer. Selected routes highlighted with white halo effect. Opacity and width scale with zoom.",
    icon: (
      <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    name: "Airports",
    type: "Circle",
    source: "airports",
    description:
      "Large airports shown as circle markers with IATA code labels. Circles scale 3-11px by zoom. Labels appear at zoom 5+ with text halo for readability.",
    icon: (
      <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
];

const MAP_CONFIG = [
  { key: "Style", value: "mapbox://styles/mapbox/dark-v11" },
  { key: "Projection", value: "globe" },
  { key: "Center", value: "[0\u00B0, 20\u00B0N]" },
  { key: "Zoom", value: "1.5" },
  { key: "Pitch", value: "20\u00B0" },
];

export default function FrontendVisualization() {
  return (
    <section id="frontend-viz" className="scroll-mt-24 space-y-8">
      <div>
        <h2 className="text-3xl font-light text-white mb-3">
          Frontend Visualization
        </h2>
        <p className="text-gray-400 text-lg">
          Mapbox GL JS renders a 3D globe with three distinct layer types.
        </p>
      </div>

      {/* Phase Color Palette */}
      <div className="bg-white/5 border border-white/[0.08] rounded-2xl p-6">
        <h4 className="text-gray-300 text-sm uppercase tracking-wider font-medium mb-4">
          Phase Color System
        </h4>
        <div className="flex gap-3 flex-wrap">
          {PHASE_COLORS.map((p) => (
            <div key={p.phase} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border"
                style={{
                  backgroundColor: `${p.color}30`,
                  borderColor: `${p.color}50`,
                }}
              >
                <div
                  className="w-full h-full rounded-lg"
                  style={{ backgroundColor: p.color, opacity: 0.8 }}
                />
              </div>
              <div>
                <div className="text-white text-xs font-medium">{p.phase}</div>
                <div className="text-gray-500 text-[10px] font-mono">
                  {p.color}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mapbox Layers */}
      <div className="space-y-4">
        {LAYERS.map((layer) => (
          <div
            key={layer.name}
            className="bg-white/5 border border-white/[0.08] rounded-2xl p-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                {layer.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-white font-medium">{layer.name}</h4>
                  <span className="font-mono text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                    {layer.type}
                  </span>
                  <span className="font-mono text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                    {layer.source}
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {layer.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Map Config */}
      <div className="bg-white/5 border border-white/[0.08] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Map Configuration
              </th>
              <th className="text-left text-gray-400 font-medium px-5 py-3 uppercase tracking-wider text-xs">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {MAP_CONFIG.map((row) => (
              <tr key={row.key} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3 text-white font-medium">{row.key}</td>
                <td className="px-5 py-3 font-mono text-emerald-400">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
