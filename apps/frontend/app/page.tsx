import { HeroSection } from "./components/landing/HeroSection";
import { HeatmapSection } from "./components/landing/HeatmapSection";

import type { JSX } from "react";

export default function Home(): JSX.Element {
  return (
    <main className="h-screen overflow-y-auto snap-y snap-mandatory">
      <HeroSection />
      <HeatmapSection />
    </main>
  );
}
