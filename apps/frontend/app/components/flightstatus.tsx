import { WS_STATUS, type WebSocketStatus } from "@/lib/shared";

interface FlightStatusIndicatorProps {
  flightCount: number;
  status: WebSocketStatus;
}

export default function FlightStatusIndicator({
  flightCount,
  status,
}: FlightStatusIndicatorProps) {
  const isConnected = status === WS_STATUS.OPEN;

  return (
    <div className="absolute top-4 left-4 bg-gray-950/70 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-2xl font-bold text-white leading-tight">
            {flightCount.toLocaleString()}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
            Flights tracked
          </span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? "bg-emerald-400" : "bg-red-400"
            }`}
            style={{
              boxShadow: isConnected
                ? "0 0 8px rgba(52, 211, 153, 0.6)"
                : "0 0 8px rgba(248, 113, 113, 0.6)",
            }}
          />
          <span
            className={`text-[10px] uppercase tracking-wider font-medium ${
              isConnected ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}
