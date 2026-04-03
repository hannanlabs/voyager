import type { JSX, ReactNode } from "react";
import DocsSidebar from "./components/DocsSidebar";

export default function DocsLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="min-h-screen">
      <DocsSidebar />
      <main className="lg:ml-64">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-16">{children}</div>
      </main>
    </div>
  );
}
