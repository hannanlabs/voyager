"use client";

import dynamic from "next/dynamic";

const HexagonHeatmapReportCard = dynamic(
  () => import("@/lib/components/ui/hexagon-map"),
  { ssr: false, loading: () => <div className="w-[600px] h-[714px] animate-pulse bg-white/5 rounded-3xl" /> }
);

export function HeatmapSection() {
  return (
    <section className="relative w-full min-h-screen snap-start bg-black overflow-hidden flex flex-col items-center justify-center py-16 px-6">
      <div className="text-center mb-12 max-w-2xl">
        <h2 className="text-4xl md:text-6xl font-thin tracking-tighter leading-none text-white mb-6">
          Preventing Crashes
          <br />
          <span className="text-red-600">Before They Happen</span>
        </h2>
        <p className="text-gray-400 font-light leading-relaxed text-lg">
          Real time conflict detection and resolution across every flight path.
          Voyager continuously monitors separation distances, predicts potential
          collisions, and triggers automated evasive adjustments, keeping skies
          safe and disruption free.
        </p>
      </div>

      <div className="dark">
        <HexagonHeatmapReportCard />
      </div>
    </section>
  );
}
