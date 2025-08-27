package httphandlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/simulator/internal/helpers"
	"github.com/hannan/voyager/simulator/internal/simulator"
)

func GeoJSONAirportsHandler(repo *simulator.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if !repo.Loaded {
			http.Error(w, "Airport data not loaded", http.StatusInternalServerError)
			return
		}

		data := repo.RawJSON
		etag := repo.ETag

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=86400, immutable")
		w.Header().Set("ETag", etag)

		if r.Header.Get("If-None-Match") == etag {
			w.WriteHeader(http.StatusNotModified)
			return
		}

		w.Write(data)
	}
}

func GeoJSONFlightRouteHandler(fs *simulator.FlightSimulator, repo *simulator.Repository) http.HandlerFunc {
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
			http.Error(w, "Flight not found", http.StatusNotFound)
			return
		}

		fromPos, fromExists := repo.Positions[f.DepartureAirport]
		toPos, toExists := repo.Positions[f.ArrivalAirport]

		if !fromExists || !toExists {
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
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	}
}
