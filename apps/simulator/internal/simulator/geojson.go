package simulator

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/shared-go/modularity"
)

func (fs *FlightSimulator) GeoJSONAirportsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	airportData := GetGlobalAirportData()
	if !airportData.IsLoaded() {
		http.Error(w, "Airport data not loaded", http.StatusInternalServerError)
		return
	}

	data := airportData.GetRawJSON()
	etag := airportData.GetETag()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=86400, immutable")
	w.Header().Set("ETag", etag)

	if r.Header.Get("If-None-Match") == etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	w.Write(data)
}

func (fs *FlightSimulator) GeoJSONFlightRouteHandler(w http.ResponseWriter, r *http.Request) {
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

	fs.flightsMu.RLock()
	f, exists := fs.flights[flightID]
	fs.flightsMu.RUnlock()

	if !exists {
		http.Error(w, "Flight not found", http.StatusNotFound)
		return
	}

	airportPositions := GetGlobalAirportData().GetPositions()
	fromPos, fromExists := airportPositions[f.DepartureAirport]
	toPos, toExists := airportPositions[f.ArrivalAirport]

	if !fromExists || !toExists {
		http.Error(w, "Airport data not found", http.StatusInternalServerError)
		return
	}

	coordinates := generateGreatCircleCoordinates(fromPos, toPos, n)

	feature := NewLineStringFeature(coordinates, map[string]interface{}{
		"id":       f.ID,
		"callSign": f.CallSign,
		"from":     f.DepartureAirport,
		"to":       f.ArrivalAirport,
	})

	featureCollection := NewFeatureCollection([]modularity.GeoJSONFeature{feature})

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=60")

	if err := json.NewEncoder(w).Encode(featureCollection); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func generateGreatCircleCoordinates(from, to flight.Position, n int) [][]float64 {
	coordinates := make([][]float64, n+1)

	for i := 0; i <= n; i++ {
		progress := float64(i) / float64(n)
		pos := InterpolatePosition(from, to, progress)
		coordinates[i] = []float64{pos.Longitude, pos.Latitude}
	}

	return coordinates
}

func NewFeatureCollection(features []modularity.GeoJSONFeature) modularity.GeoJSONFeatureCollection {
	return modularity.GeoJSONFeatureCollection{
		Type:     "FeatureCollection",
		Features: features,
	}
}

func NewPointFeature(longitude, latitude, altitude float64, properties map[string]interface{}) modularity.GeoJSONFeature {
	return modularity.GeoJSONFeature{
		Type: "Feature",
		Geometry: modularity.GeoJSONGeometry{
			Type:        "Point",
			Coordinates: []float64{longitude, latitude, altitude},
		},
		Properties: properties,
	}
}

func NewLineStringFeature(coordinates [][]float64, properties map[string]interface{}) modularity.GeoJSONFeature {
	return modularity.GeoJSONFeature{
		Type: "Feature",
		Geometry: modularity.GeoJSONGeometry{
			Type:        "LineString",
			Coordinates: coordinates,
		},
		Properties: properties,
	}
}
