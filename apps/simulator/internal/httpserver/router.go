package httpserver

import (
	"net/http"
)

type FlightSimulatorInterface interface {
	WSFlightsHandler(w http.ResponseWriter, r *http.Request)
	GeoJSONAirportsHandler(w http.ResponseWriter, r *http.Request)
	GeoJSONFlightRouteHandler(w http.ResponseWriter, r *http.Request)
}

func NewRouter(simulator FlightSimulatorInterface) http.Handler {
	mux := http.NewServeMux()
	
	mux.HandleFunc("/healthz", HealthzHandler)
	mux.HandleFunc("/readyz", ReadyzHandler)
	mux.HandleFunc("/ws/flights", simulator.WSFlightsHandler)
	mux.HandleFunc("/geojson/airports", simulator.GeoJSONAirportsHandler)
	mux.HandleFunc("/geojson/flights/route", simulator.GeoJSONFlightRouteHandler)
	
	return CORSMiddleware(mux)
}