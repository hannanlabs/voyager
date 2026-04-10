"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SECTIONS = [
  { id: "architecture", label: "Architecture" },
  { id: "api-reference", label: "API Reference" },
  { id: "simulator-engine", label: "Simulator Engine" },
  { id: "data-flow", label: "Data Flow" },
  { id: "frontend-viz", label: "Visualization" },
  { id: "observability", label: "Observability" },
] as const;

export default function DocsSidebar() {
  const [activeSection, setActiveSection] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const nav = (
    <nav className="space-y-1">
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          onClick={() => setMobileOpen(false)}
          className={`block px-4 py-2.5 text-sm rounded-xl transition-colors ${
            activeSection === section.id
              ? "text-white bg-white/10 border-l-2 border-red-600"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl p-2.5"
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 z-40 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <Link href="/" className="text-lg font-light tracking-wide text-red-600">
            VOYAGER
          </Link>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">
            Documentation
          </p>
        </div>
        <div className="px-3">{nav}</div>
      </aside>
    </>
  );
}
