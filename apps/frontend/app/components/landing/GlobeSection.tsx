"use client";

import Globe from "@/lib/components/ui/globe";

export function GlobeSection() {
  return (
    <section className="relative w-full h-screen snap-start bg-black overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <Globe />
      </div>
    </section>
  );
}
