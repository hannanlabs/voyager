import type { Metadata } from 'next';
import type { JSX } from 'react';

export const metadata: Metadata = {
  title: 'Voyager Globe',
  description: 'A Global Air Traffic Simulation Orchestrated via Kubernetes',
};

export default function GlobeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return <div>{children}</div>;
}
