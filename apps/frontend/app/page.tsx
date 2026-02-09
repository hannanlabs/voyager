import Link from "next/link";

import type { JSX } from "react";

export default function Home(): JSX.Element {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="relative">
        <nav className="border-b border-gray-200 px-8 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-xl font-light tracking-wide">VOYAGER</div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-8 py-24">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-thin mb-8 tracking-tighter leading-none">
              Global Air Traffic
              <br />
              <span className="text-red-600">Simulation</span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl font-light">
              Real-time flight simulation with live physics calculations and
              WebSocket streaming, built for scalability and observability.
            </p>

            <div className="flex gap-6 mb-24">
              <Link
                href="/globe"
                className="bg-red-600 text-white px-8 py-3 font-medium hover:bg-red-700 transition-colors"
              >
                Explore Globe
              </Link>
              <a
                href="https://github.com/hannanlabs/voyager"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-300 px-8 py-3 font-medium hover:border-red-600 transition-colors"
              >
                View Source
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 mb-24">
            <div className="bg-white p-8 hover:bg-gray-50 transition-colors">
              <h3 className="text-lg font-medium mb-4 text-black">
                Flight Simulator
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Go-based simulation engine generating realistic flight paths
                with physics calculations for drag, lift, and wind effects.
              </p>
            </div>

            <div className="bg-white p-8 hover:bg-gray-50 transition-colors">
              <h3 className="text-lg font-medium mb-4 text-black">
                Real-time Physics
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Vector field approximations simulate drag, lift, and wind
                currents using Navier-Stokes inspired dynamics.
              </p>
            </div>

            <div className="bg-white p-8 hover:bg-gray-50 transition-colors">
              <h3 className="text-lg font-medium mb-4 text-black">
                WebSocket Streaming
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Live telemetry streams flight positions, velocity vectors, and
                phase transitions to the 3D globe interface.
              </p>
            </div>

            <div className="bg-white p-8 hover:bg-gray-50 transition-colors">
              <h3 className="text-lg font-medium mb-4 text-black">
                Observability
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Comprehensive monitoring with Prometheus metrics, Loki logs, and
                OpenTelemetry distributed tracing.
              </p>
            </div>

            <div className="bg-white p-8 hover:bg-gray-50 transition-colors">
              <h3 className="text-lg font-medium mb-4 text-black">
                Chaos Testing
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Chaos Mesh integration for pod-level failures and network
                perturbations, plus configurable simulator fault injection.
              </p>
            </div>

            <div className="bg-white p-8 hover:bg-gray-50 transition-colors">
              <h3 className="text-lg font-medium mb-4 text-black">
                Scalable Architecture
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Kubernetes-ready design with horizontal scaling capabilities and
                resource optimization for high-volume flight simulation.
              </p>
            </div>
          </div>

          <div className="border border-gray-200 p-12">
            <h2 className="text-3xl font-thin mb-12 text-center">
              Technical Architecture
            </h2>
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <h3 className="text-lg font-medium mb-6 text-black">
                  Infrastructure
                </h3>
                <div className="space-y-4 text-gray-500 text-sm">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Platform</span>
                    <span>Kubernetes</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Backend</span>
                    <span>Go Simulator</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Infrastructure</span>
                    <span>Terraform</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Development</span>
                    <span>Tilt</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-6 text-black">
                  Data Flow
                </h3>
                <div className="space-y-4 text-gray-500 text-sm">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Streaming</span>
                    <span>WebSocket</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Frontend</span>
                    <span>React + MapGL</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Physics</span>
                    <span>Real-time Simulation</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Tracing</span>
                    <span>OpenTelemetry</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-gray-200 mt-24 py-12">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center text-gray-500 text-sm font-light">
              Real-time flight simulation demonstrating scalable WebSocket
              streaming and physics-based modeling.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
