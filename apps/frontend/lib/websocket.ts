import type {
  FlightState,
  WebSocketStatus,
  FlightPointsGeoJSON,
} from "@voyager/shared-ts";
import {
  validateWebSocketMessage,
  WS_STATUS,
  extractFlightsFromGeoJSON,
  SIMULATOR_WS_URL,
} from "@voyager/shared-ts";
import { logEvent, initTelemetry } from "./telemetry";

export type FlightDataHandler = (
  flights: Map<string, FlightState>,
  geoJSON: FlightPointsGeoJSON,
) => void;

export type StatusHandler = (status: WebSocketStatus) => void;

export interface WebSocketConnection {
  close: () => void;
}

export function createFlightWebSocket(
  onData: FlightDataHandler,
  onStatus: StatusHandler,
): WebSocketConnection {
  initTelemetry();

  let shouldConnect = true;
  let reconnectTimeout: NodeJS.Timeout | null = null;

  const ws = new WebSocket(SIMULATOR_WS_URL);

  ws.onopen = () => {
    onStatus(WS_STATUS.OPEN);
    logEvent("websocket_connected", { url: SIMULATOR_WS_URL });
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    try {
      const message = validateWebSocketMessage(
        JSON.parse(event.data as string),
      );
      const flightMap = extractFlightsFromGeoJSON(message.featureCollection);

      onData(flightMap, message.featureCollection);

      logEvent("websocket_message", {
        flight_count: flightMap.size,
        message_size: event.data.length,
      });
    } catch (error) {
      logEvent("websocket_error", { error: (error as Error).message });
      console.error("Failed to process WebSocket message:", error);
      onStatus(WS_STATUS.ERROR);
    }
  };

  ws.onerror = (error) => {
    logEvent("websocket_error", { url: SIMULATOR_WS_URL });
    console.error("WebSocket error:", error);
    onStatus(WS_STATUS.ERROR);
  };

  ws.onclose = (event) => {
    logEvent("websocket_closed", {
      code: event.code,
      clean: event.code === 1000,
    });
    console.log("WebSocket closed:", event.code, event.reason);
    onStatus(WS_STATUS.CLOSED);

    if (shouldConnect && event.code !== 1000) {
      reconnectTimeout = setTimeout(() => {
        if (shouldConnect) {
          window.location.reload();
        }
      }, 3000);
    }
  };

  return {
    close: () => {
      shouldConnect = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      ws.close(1000, "Connection closed");
    },
  };
}
