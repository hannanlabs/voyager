package httpserver

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/simulator/internal/helpers"
	"github.com/hannan/voyager/simulator/internal/sim"
	"github.com/hannan/voyager/simulator/internal/telemetry"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

func HealthzHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func ReadyzHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func GeoJSONAirportsHandler(airports *sim.AirportStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if !airports.Loaded {
			http.Error(w, "Airport data not loaded", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=86400, immutable")
		w.Header().Set("ETag", airports.ETag)

		if r.Header.Get("If-None-Match") == airports.ETag {
			w.WriteHeader(http.StatusNotModified)
			return
		}
		w.Write(airports.RawJSON)
	}
}

func GeoJSONFlightRouteHandler(simulator *sim.Simulator, airports *sim.AirportStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		flightID := r.URL.Query().Get("id")
		if flightID == "" {
			http.Error(w, "Missing required parameter: id", http.StatusBadRequest)
			return
		}

		n := 128
		if nStr := r.URL.Query().Get("n"); nStr != "" {
			if parsed, err := strconv.Atoi(nStr); err == nil && parsed > 0 {
				n = parsed
			}
		}

		f, exists := simulator.GetFlight(flightID)
		if !exists {
			http.Error(w, "Flight not found", http.StatusNotFound)
			return
		}

		fromPos, fromOK := airports.Positions[f.DepartureAirport]
		toPos, toOK := airports.Positions[f.ArrivalAirport]
		if !fromOK || !toOK {
			http.Error(w, "Airport data not found", http.StatusInternalServerError)
			return
		}

		coords := helpers.GenerateGreatCircleCoordinates(fromPos, toPos, n)
		feature := helpers.NewLineStringFeature(coords, map[string]interface{}{
			"id":       f.ID,
			"callSign": f.CallSign,
			"from":     f.DepartureAirport,
			"to":       f.ArrivalAirport,
		})

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=60")
		json.NewEncoder(w).Encode(helpers.NewFeatureCollection([]helpers.GeoJSONFeature{feature}))
	}
}

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "http://localhost:3000"
	},
}

func WSFlightsHandler(simulator *sim.Simulator) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracer := otel.Tracer("flight-simulator")
		_, span := tracer.Start(r.Context(), "websocket.upgrade")
		defer span.End()

		conn, err := wsUpgrader.Upgrade(w, r, nil)
		if err != nil {
			span.RecordError(err)
			telemetry.LogError("WebSocket upgrade failed", err, "remote_addr", r.RemoteAddr)
			return
		}

		span.SetAttributes(attribute.String("websocket.status", "connected"))
		simulator.AddClient(conn)
		log.Printf("WebSocket client connected")

		defer func() {
			simulator.RemoveClient(conn)
			log.Printf("WebSocket client disconnected")
		}()

		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					telemetry.LogError("WebSocket error", err)
				}
				break
			}
		}
	}
}
