import type { Metadata } from "next";
import type { JSX } from "react";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
