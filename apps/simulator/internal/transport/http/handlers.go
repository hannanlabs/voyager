package httphandlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/simulator/internal/helpers"
	"github.com/hannan/voyager/simulator/internal/simulator"
	"github.com/hannan/voyager/simulator/internal/simulator/components/airport"
	"github.com/hannan/voyager/simulator/internal/telemetry"
)

func GeoJSONAirportsHandler(repo *airport.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			telemetry.LogError("Invalid HTTP method for airports endpoint", nil,
				"method", r.Method,
				"endpoint", "/geojson/airports",
				"remote_addr", r.RemoteAddr)
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if !repo.Loaded {
			telemetry.LogError("Airport repository not loaded", nil,
				"endpoint", "/geojson/airports",
				"remote_addr", r.RemoteAddr)
			http.Error(w, "Airport data not loaded", http.StatusInternalServerError)
			return
		}

		data := repo.RawJSON
		etag := repo.ETag

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=86400, immutable")
		w.Header().Set("ETag", etag)

		if r.Header.Get("If-None-Match") == etag {
			telemetry.LogInfo("Airport data served from cache",
				"endpoint", "/geojson/airports",
				"status", "304",
				"remote_addr", r.RemoteAddr)
			w.WriteHeader(http.StatusNotModified)
			return
		}

		telemetry.LogInfo("Airport data served successfully",
			"endpoint", "/geojson/airports",
			"status", "200",
			"data_size", len(data),
			"remote_addr", r.RemoteAddr)
		w.Write(data)
	}
}

func GeoJSONFlightRouteHandler(fs *simulator.FlightSimulator, repo *airport.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			telemetry.LogError("Invalid HTTP method for flight route endpoint", nil,
				"method", r.Method,
				"endpoint", "/geojson/flights/route",
				"remote_addr", r.RemoteAddr)
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		flightID := r.URL.Query().Get("id")
		if flightID == "" {
			telemetry.LogError("Missing flight ID parameter", nil,
				"endpoint", "/geojson/flights/route",
				"remote_addr", r.RemoteAddr)
			http.Error(w, "Missing required parameter: id", http.StatusBadRequest)
			return
		}

		nStr := r.URL.Query().Get("n")
		n := 128
		if nStr != "" {
			if parsed, err := strconv.Atoi(nStr); err == nil && parsed > 0 {
				n = parsed
			}
		}

		var f *flight.State
		f, exists := fs.GetFlightByID(flightID)
		if !exists {
			telemetry.LogError("Flight not found", nil,
				"flight_id", flightID,
				"endpoint", "/geojson/flights/route",
				"remote_addr", r.RemoteAddr)
			http.Error(w, "Flight not found", http.StatusNotFound)
			return
		}

		fromPos, fromExists := repo.Positions[f.DepartureAirport]
		toPos, toExists := repo.Positions[f.ArrivalAirport]

		if !fromExists || !toExists {
			telemetry.LogError("Airport position data not found", nil,
				"flight_id", flightID,
				"departure_airport", f.DepartureAirport,
				"arrival_airport", f.ArrivalAirport,
				"endpoint", "/geojson/flights/route",
				"remote_addr", r.RemoteAddr)
			http.Error(w, "Airport data not found", http.StatusInternalServerError)
			return
		}

		coordinates := helpers.GenerateGreatCircleCoordinates(fromPos, toPos, n)

		feature := helpers.NewLineStringFeature(coordinates, map[string]interface{}{
			"id":       f.ID,
			"callSign": f.CallSign,
			"from":     f.DepartureAirport,
			"to":       f.ArrivalAirport,
		})

		featureCollection := helpers.NewFeatureCollection([]helpers.GeoJSONFeature{feature})

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=60")

		if err := json.NewEncoder(w).Encode(featureCollection); err != nil {
			telemetry.LogError("Failed to encode flight route response", err,
				"flight_id", flightID,
				"endpoint", "/geojson/flights/route",
				"remote_addr", r.RemoteAddr)
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}

		telemetry.LogInfo("Flight route served successfully",
			"flight_id", flightID,
			"call_sign", f.CallSign,
			"departure_airport", f.DepartureAirport,
			"arrival_airport", f.ArrivalAirport,
			"coordinate_points", n,
			"endpoint", "/geojson/flights/route",
			"status", "200",
			"remote_addr", r.RemoteAddr)
	}
}
