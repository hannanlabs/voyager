import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const response = await fetch("http://otel-collector:4318/v1/traces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resourceSpans: [
          {
            resource: {
              attributes: [
                {
                  key: "service.name",
                  value: { stringValue: "voyager-frontend" },
                },
                { key: "service.version", value: { stringValue: "1.0.0" } },
              ],
            },
            scopeSpans: [
              {
                spans: [
                  {
                    traceId: data.traceId || "",
                    spanId: data.spanId || "",
                    name: data.event,
                    kind: 3,
                    startTimeUnixNano: data.timestamp * 1000000,
                    endTimeUnixNano: data.timestamp * 1000000,
                    status: { code: 1 },
                    attributes: Object.entries(data)
                      .filter(
                        ([k]) =>
                          !["event", "timestamp", "traceId", "spanId"].includes(
                            k,
                          ),
                      )
                      .map(([key, value]) => ({
                        key,
                        value: { stringValue: String(value) },
                      })),
                  },
                ],
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Failed to forward to collector:", response.statusText);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error forwarding telemetry:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
