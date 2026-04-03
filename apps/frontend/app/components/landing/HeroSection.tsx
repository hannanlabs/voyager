"use client";

import Link from "next/link";
import Globe from "@/lib/components/ui/globe";
import { useScreenSize } from "@/lib/hooks/use-screen-size";
import { PixelTrail } from "@/lib/components/ui/pixel-trail";
import { GooeyFilter } from "@/lib/components/ui/gooey-filter";

export function HeroSection() {
  const screenSize = useScreenSize();

  return (
    <section className="relative w-full h-screen snap-start bg-black overflow-hidden flex items-center">
      <GooeyFilter id="gooey-filter-hero" strength={5} />

      <div
        className="absolute inset-0 z-0"
        style={{ filter: "url(#gooey-filter-hero)" }}
      >
        <PixelTrail
          pixelSize={screenSize.lessThan("md") ? 24 : 32}
          fadeDuration={0}
          delay={500}
          pixelClassName="bg-red-600"
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center gap-8 md:gap-0">
        {/* Left side — Hero text */}
        <div className="flex-1 flex flex-col items-start text-left">
          <div className="text-3xl md:text-4xl font-thin tracking-tighter uppercase text-gray-400 mb-4">
            VOYAGER
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-thin tracking-tighter leading-none text-white mb-8">
            Air Traffic
            <br />
            <span className="text-red-600">Simulation</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-12 leading-relaxed max-w-lg font-light">
            Real time flight simulation with live physics calculations and
            WebSocket streaming, built for scalability and observability.
          </p>

          <div className="flex gap-6">
            <Link
              href="/globe"
              className="bg-red-600 text-white px-8 py-3 font-medium hover:bg-red-700 transition-colors rounded-md"
            >
              Explore Globe
            </Link>
            <a
              href="https://github.com/hannanlabs/voyager"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-600 text-gray-300 px-8 py-3 font-medium hover:border-red-600 hover:text-white transition-colors rounded-md"
            >
              View Source
            </a>
          </div>
        </div>

        {/* Right side — Globe */}
        <div className="flex-1 flex items-center justify-center">
          <Globe />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <svg
          className="w-6 h-6 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}
