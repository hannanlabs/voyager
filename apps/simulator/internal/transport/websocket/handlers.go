package wshandlers

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/simulator/internal/simulator"
	"github.com/hannan/voyager/simulator/internal/telemetry"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

func WSFlightsHandler(fs *simulator.FlightSimulator) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracer := otel.Tracer("flight-simulator")
		_, span := tracer.Start(r.Context(), "websocket.upgrade")
		defer span.End()

		conn, err := (&websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				return origin == "http://localhost:3000"
			},
		}).Upgrade(w, r, nil)
		if err != nil {
			span.RecordError(err)
			span.SetAttributes(attribute.String("error.type", "websocket_upgrade_failed"))
			telemetry.LogError("WebSocket upgrade failed", err, "remote_addr", r.RemoteAddr)
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

		span.SetAttributes(attribute.String("websocket.status", "connected"))
		fs.AddClient(conn)
		telemetry.LogInfo("WebSocket client connected", "remote_addr", r.RemoteAddr)
		log.Printf("New WebSocket client connected")

		defer func() {
			fs.RemoveClient(conn)
			span.SetAttributes(attribute.String("websocket.status", "disconnected"))
			telemetry.LogInfo("WebSocket client disconnected", "remote_addr", r.RemoteAddr)
			log.Printf("WebSocket client disconnected")
		}()

		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					span.RecordError(err)
					telemetry.LogError("WebSocket unexpected close", err, "remote_addr", r.RemoteAddr)
					log.Printf("WebSocket error: %v", err)
				}
				break
			}
		}
	}
}
