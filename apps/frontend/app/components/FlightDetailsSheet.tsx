'use client';

import type { FlightState } from '../domain/flight';

export type FlightDetailsSheetProps = {
  flight: FlightState | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function FlightDetailsSheet({
  flight,
  isOpen,
  onClose,
}: FlightDetailsSheetProps): React.ReactElement | null {
  if (!isOpen || !flight) return null;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'takeoff':
        return 'text-orange-600';
      case 'climb':
        return 'text-amber-600';
      case 'cruise':
        return 'text-emerald-600';
      case 'descent':
        return 'text-blue-600';
      case 'landing':
        return 'text-purple-600';
      default:
        return 'text-slate-800';
    }
  };

  const getPhaseBackground = (phase: string) => {
    switch (phase) {
      case 'takeoff':
        return 'bg-orange-50 border-orange-200';
      case 'climb':
        return 'bg-amber-50 border-amber-200';
      case 'cruise':
        return 'bg-emerald-50 border-emerald-200';
      case 'descent':
        return 'bg-blue-50 border-blue-200';
      case 'landing':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'takeoff':
        return '🛫';
      case 'climb':
        return '↗️';
      case 'cruise':
        return '✈️';
      case 'descent':
        return '↘️';
      case 'landing':
        return '🛬';
      default:
        return '✈️';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed right-0 top-0 h-full w-96 bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 border-l border-slate-200">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent_50%)]"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Flight Details</h2>
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-white">{flight.airline}</span>
                  <span className="text-xl font-medium text-slate-200">{flight.callSign}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-100">
                  <span className="text-lg font-semibold bg-white/10 px-3 py-1 rounded-lg">
                    {flight.departureAirport}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-400 to-slate-600"></div>
                  <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10.293 15.707a1 1 0 010-1.414L14.586 10 10.293 5.707a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                    />
                  </svg>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-600 to-slate-400"></div>
                  <span className="text-lg font-semibold bg-white/10 px-3 py-1 rounded-lg">
                    {flight.arrivalAirport}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Current Status</h3>
              <div className={`${getPhaseBackground(flight.phase)} rounded-xl p-5 border-2`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl bg-white rounded-full p-2 shadow-sm">
                    {getPhaseIcon(flight.phase)}
                  </div>
                  <div>
                    <span className={`text-xl font-bold capitalize ${getPhaseColor(flight.phase)}`}>
                      {flight.phase}
                    </span>
                    <p className="text-slate-700 font-medium">Current phase</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-white/50">
                    <p className="text-slate-800 font-semibold text-sm">Altitude</p>
                    <p className="text-lg font-bold text-slate-800">
                      {flight.position.altitude.toLocaleString()} ft
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-white/50">
                    <p className="text-slate-800 font-semibold text-sm">Speed</p>
                    <p className="text-lg font-bold text-slate-800">
                      {flight.speed.toFixed(0)} kts
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Schedule</h3>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-bold text-slate-800 text-base">Departure</p>
                    <p className="text-slate-700 font-semibold">{flight.departureAirport}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-base">
                      {formatTime(flight.scheduledDeparture)}
                    </p>
                    <p className="text-slate-700 font-medium">
                      {formatDate(flight.scheduledDeparture)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-bold text-slate-800 text-base">Scheduled Arrival</p>
                    <p className="text-slate-700 font-semibold">{flight.arrivalAirport}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-base">
                      {formatTime(flight.scheduledArrival)}
                    </p>
                    <p className="text-slate-700 font-medium">
                      {formatDate(flight.scheduledArrival)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                  <div>
                    <p className="font-bold text-slate-800 text-base">Estimated Arrival</p>
                    <p className="text-emerald-700 font-semibold">Updated estimate</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-700 text-base">
                      {formatTime(flight.estimatedArrival)}
                    </p>
                    <p className="text-emerald-600 font-medium">
                      {formatDate(flight.estimatedArrival)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Progress */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Flight Progress</h3>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-800 font-bold">Progress</span>
                    <span className="text-2xl font-bold text-slate-800">
                      {(flight.progress * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(flight.progress * 100).toFixed(1)}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-800 font-bold text-sm">Current Speed</p>
                      <p className="text-xl font-bold text-slate-800">
                        {flight.speed.toFixed(0)} kts
                      </p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-800 font-bold text-sm">Bearing</p>
                      <p className="text-xl font-bold text-slate-800">
                        {flight.bearing.toFixed(1)}°
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Position Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Position</h3>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-3">
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-800 font-bold">Latitude</span>
                  <span className="font-mono font-bold text-slate-800">
                    {flight.position.latitude.toFixed(6)}°
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-800 font-bold">Longitude</span>
                  <span className="font-mono font-bold text-slate-800">
                    {flight.position.longitude.toFixed(6)}°
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-slate-800 font-bold">Altitude</span>
                  <span className="font-mono font-bold text-blue-700">
                    {flight.position.altitude.toLocaleString()} ft
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
