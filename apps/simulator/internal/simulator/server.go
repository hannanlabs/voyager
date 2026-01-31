package simulator

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/shared-go/geojson"
	"github.com/hannan/voyager/shared-go/geomath"
	"github.com/hannan/voyager/simulator/internal/telemetry"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

func StartServer(port string, handler http.Handler) error {
	log.Printf("Starting server on :%s", port)
	return http.ListenAndServe(":"+port, handler)
}

func NewRouter(s *Simulator, airports *AirportStore) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", healthzHandler)
	mux.HandleFunc("/readyz", readyzHandler)
	mux.HandleFunc("/ws/flights", s.wsFlightsHandler)
	mux.HandleFunc("/geojson/airports", airportsHandler(airports))
	mux.HandleFunc("/geojson/flights/route", flightRouteHandler(s, airports))
	return otelhttp.NewHandler(corsMiddleware(mux), "flight-simulator")
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if origin := r.Header.Get("Origin"); origin == "http://localhost:3000" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func healthzHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func readyzHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func airportsHandler(airports *AirportStore) http.HandlerFunc {
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

func flightRouteHandler(s *Simulator, airports *AirportStore) http.HandlerFunc {
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
		f, exists := s.flights.get(flightID)
		if !exists {
			http.Error(w, "Flight not found", http.StatusNotFound)
			return
		}
		fromPos, toPos := airports.Positions[f.DepartureAirport], airports.Positions[f.ArrivalAirport]
		coords := geomath.GenerateGreatCircleCoordinates(fromPos, toPos, n)
		feature := geojson.NewLineStringFeature(coords, map[string]interface{}{
			"id": f.ID, "callSign": f.CallSign, "from": f.DepartureAirport, "to": f.ArrivalAirport,
		})
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=60")
		json.NewEncoder(w).Encode(geojson.NewFeatureCollection([]geojson.Feature{feature}))
	}
}

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return r.Header.Get("Origin") == "http://localhost:3000" },
}

func (s *Simulator) wsFlightsHandler(w http.ResponseWriter, r *http.Request) {
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
	s.clients.add(conn)
	log.Printf("WebSocket client connected")

	go s.clients.sendInitial(conn, s.buildFlightsGeoJSON())

	defer func() {
		s.clients.remove(conn)
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
