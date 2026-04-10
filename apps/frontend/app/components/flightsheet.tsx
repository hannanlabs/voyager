"use client";

import type { FlightState } from "@/lib/shared";

interface FlightDetailsSheetProps {
  flight: FlightState | null;
  isOpen: boolean;
  onClose: () => void;
}

const PHASE_COLORS: Record<string, string> = {
  takeoff: "#ff7849",
  climb: "#ffab40",
  cruise: "#00e676",
  descent: "#ffca28",
  landing: "#ff5252",
};

function getPhaseColor(phase: string): string {
  return PHASE_COLORS[phase] ?? "#607d8b";
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono font-medium text-white">{value}</span>
    </div>
  );
}

export default function FlightDetailsSheet({
  flight,
  isOpen,
  onClose,
}: FlightDetailsSheetProps): React.ReactElement {
  const phaseColor = flight ? getPhaseColor(flight.phase) : "#607d8b";

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 z-50 transform transition-transform duration-300 ease-out ${
        isOpen && flight ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
      }`}
    >
      <div className="h-full bg-gray-950/90 backdrop-blur-xl border-l border-white/10 shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white/5 border-b border-white/10 px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white/80"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-white tracking-wide">
                  Flight Details
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {flight && (
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-medium text-white">
                    {flight.airline}
                  </span>
                  <span className="font-mono text-sm text-gray-400 bg-white/10 px-2.5 py-1 rounded-lg">
                    {flight.callSign}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                    <span className="font-mono text-lg tracking-widest">
                      {flight.departureAirport}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
                    <svg
                      className="w-4 h-4 text-white/40"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 15.707a1 1 0 010-1.414L14.586 10 10.293 5.707a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                      />
                    </svg>
                    <div className="flex-1 h-px bg-gradient-to-l from-white/30 to-transparent" />
                  </div>
                  <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                    <span className="font-mono text-lg tracking-widest">
                      {flight.arrivalAirport}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          {flight && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Phase */}
              <div className="space-y-3">
                <h3 className="text-gray-300 text-sm uppercase tracking-wider font-medium">
                  Status
                </h3>
                <div className="bg-white/5 border border-white/[0.08] rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Phase</span>
                    <span
                      className="font-mono text-sm font-medium capitalize px-3 py-1 rounded-lg border"
                      style={{
                        color: phaseColor,
                        backgroundColor: `${phaseColor}20`,
                        borderColor: `${phaseColor}30`,
                      }}
                    >
                      {flight.phase}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <h3 className="text-gray-300 text-sm uppercase tracking-wider font-medium">
                  Progress
                </h3>
                <div className="bg-white/5 border border-white/[0.08] rounded-2xl p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Completion</span>
                    <span className="text-2xl font-mono font-bold text-white">
                      {(flight.progress * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 relative"
                      style={{
                        width: `${(flight.progress * 100).toFixed(1)}%`,
                        backgroundColor: phaseColor,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Position */}
              <div className="space-y-3">
                <h3 className="text-gray-300 text-sm uppercase tracking-wider font-medium">
                  Position
                </h3>
                <div className="bg-white/5 border border-white/[0.08] rounded-2xl p-4 space-y-2">
                  <DataRow
                    label="Latitude"
                    value={`${flight.position.latitude.toFixed(6)}\u00B0`}
                  />
                  <DataRow
                    label="Longitude"
                    value={`${flight.position.longitude.toFixed(6)}\u00B0`}
                  />
                  <DataRow
                    label="Altitude"
                    value={`${flight.position.altitude.toLocaleString()} ft`}
                  />
                  <DataRow
                    label="Bearing"
                    value={`${flight.bearing.toFixed(1)}\u00B0`}
                  />
                  <DataRow
                    label="Speed"
                    value={`${flight.speed.toFixed(0)} kts`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
