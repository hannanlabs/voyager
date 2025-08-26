import type { WebSocketStatus } from '@voyager/shared-ts';
import { WS_STATUS } from '@voyager/shared-ts';

interface FlightStatusIndicatorProps {
  flightCount: number;
  status: WebSocketStatus;
}

export default function FlightStatusIndicator({ flightCount, status }: FlightStatusIndicatorProps) {
  return (
    <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="font-mono text-lg font-bold">{flightCount.toLocaleString()} flights</span>
      </div>
      <div className="text-xs text-gray-300 mt-1">
        {status === WS_STATUS.OPEN ? 'Live' : 'Disconnected'}
      </div>
    </div>
  );
}
