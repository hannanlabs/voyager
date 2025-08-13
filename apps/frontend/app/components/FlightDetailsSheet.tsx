'use client';

import type { FlightState } from '@voyager/shared-ts';

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


  return (
    <>
      {/* Sheet */}
      <div className="fixed right-0 top-0 h-full w-96 bg-gray-50 shadow-2xl z-50 transform transition-transform duration-300 border-l border-gray-300">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black px-8 py-8 relative overflow-hidden">
            {/* Subtle background patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-light text-white tracking-wide">Flight Details</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-all duration-200 p-3 hover:bg-white/10 rounded-2xl backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-light text-white tracking-wide">{flight.airline}</span>
                  <span className="text-lg font-mono text-gray-300 bg-white/10 px-3 py-1 rounded-xl">{flight.callSign}</span>
                </div>
                <div className="flex items-center gap-4 text-white">
                  <div className="bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
                    <span className="text-lg font-medium tracking-wider">{flight.departureAirport}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-white/40 to-white/20"></div>
                    <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10 10.293 5.707a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"/>
                      </svg>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-l from-white/40 to-white/20"></div>
                  </div>
                  <div className="bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
                    <span className="text-lg font-medium tracking-wider">{flight.arrivalAirport}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 bg-gradient-to-b from-gray-50 to-white">
            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-xl font-light text-gray-800 tracking-wide">Current Status</h3>
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200/50 backdrop-blur-sm">
                <div className="flex justify-between items-center p-4 bg-gray-50/80 rounded-2xl">
                  <span className="text-gray-700 font-medium">Phase</span>
                  <span className="font-mono font-semibold text-gray-900 capitalize px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                    {flight.phase}
                  </span>
                </div>
              </div>
            </div>

            {/* Flight Progress */}
            <div className="space-y-4">
              <h3 className="text-xl font-light text-gray-800 tracking-wide">Flight Progress</h3>
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200/50">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Progress</span>
                    <span className="text-3xl font-light text-gray-900 tracking-wide">
                      {(flight.progress * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 h-4 rounded-full transition-all duration-500 shadow-sm relative overflow-hidden"
                      style={{ width: `${(flight.progress * 100).toFixed(1)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Position Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-light text-gray-800 tracking-wide">Position</h3>
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200/50 space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50/80 rounded-2xl">
                  <span className="text-gray-700 font-medium">Latitude</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {flight.position.latitude.toFixed(6)}°
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50/80 rounded-2xl">
                  <span className="text-gray-700 font-medium">Longitude</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {flight.position.longitude.toFixed(6)}°
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/70 shadow-sm">
                  <span className="text-gray-700 font-medium">Altitude</span>
                  <span className="font-mono font-semibold text-gray-900 px-3 py-1 bg-white rounded-xl border border-gray-200">
                    {flight.position.altitude.toLocaleString()} ft
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/70 shadow-sm">
                  <span className="text-gray-700 font-medium">Bearing</span>
                  <span className="font-mono font-semibold text-gray-900 px-3 py-1 bg-white rounded-xl border border-gray-200">
                    {flight.bearing.toFixed(1)}°
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/70 shadow-sm">
                  <span className="text-gray-700 font-medium">Speed</span>
                  <span className="font-mono font-semibold text-gray-900 px-3 py-1 bg-white rounded-xl border border-gray-200">
                    {flight.speed.toFixed(0)} kts
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
