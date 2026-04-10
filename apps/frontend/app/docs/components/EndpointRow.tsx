import type { ReactNode } from "react";

interface EndpointRowProps {
  method: "GET" | "POST" | "WS";
  path: string;
  description: string;
  children?: ReactNode;
}

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  WS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function EndpointRow({
  method,
  path,
  description,
  children,
}: EndpointRowProps) {
  return (
    <div className="bg-white/5 border border-white/[0.08] rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <span
          className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-lg border ${METHOD_STYLES[method]}`}
        >
          {method}
        </span>
        <code className="font-mono text-sm text-white">{path}</code>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
      {children}
    </div>
  );
}
