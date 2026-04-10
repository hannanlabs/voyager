interface FlowStep {
  label: string;
  sublabel?: string;
  color?: string;
}

interface FlowDiagramProps {
  steps: FlowStep[];
  title?: string;
}

export default function FlowDiagram({ steps, title }: FlowDiagramProps) {
  return (
    <div className="bg-white/5 border border-white/[0.08] rounded-2xl p-6">
      {title && (
        <h4 className="text-gray-300 text-sm uppercase tracking-wider font-medium mb-6">
          {title}
        </h4>
      )}
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center shrink-0">
            <div className="flex flex-col items-center">
              <div
                className="px-6 py-3 rounded-xl border text-center min-w-[160px]"
                style={{
                  borderColor: step.color
                    ? `${step.color}40`
                    : "rgba(255,255,255,0.1)",
                  backgroundColor: step.color
                    ? `${step.color}15`
                    : "rgba(255,255,255,0.05)",
                }}
              >
                <span className="text-white text-sm font-medium block">
                  {step.label}
                </span>
                {step.sublabel && (
                  <span className="text-gray-400 text-xs mt-1 block">
                    {step.sublabel}
                  </span>
                )}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center px-3 shrink-0">
                <div className="w-10 h-px bg-white/20" />
                <svg
                  className="w-3 h-3 text-white/30 -ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
