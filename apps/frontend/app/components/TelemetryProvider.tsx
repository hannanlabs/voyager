"use client";

import { useEffect } from "react";
import { initTelemetry } from "../utils/telemetry";

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      initTelemetry();
    }
  }, []);

  return <>{children}</>;
}
