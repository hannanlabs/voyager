export function initTelemetry() {
  console.log("Telemetry initialized");
}

function generateTraceId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

function generateSpanId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

export function logEvent(name: string, attributes: Record<string, any> = {}) {
  const traceId = generateTraceId();
  const spanId = generateSpanId();

  fetch("/api/traces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: name,
      traceId,
      spanId,
      timestamp: Date.now(),
      ...attributes,
    }),
  }).catch(() => {});
}
