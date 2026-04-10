import type { Metadata } from "next";
import type { JSX } from "react";
import "./globals.css";
import { TelemetryProvider } from "./components/TelemetryProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Voyager",
  description: "A Global Air Traffic Simulation Orchestrated via Kubernetes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <TelemetryProvider>{children}</TelemetryProvider>
      </body>
    </html>
  );
}
