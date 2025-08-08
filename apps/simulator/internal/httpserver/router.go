package httpserver

import (
	"net/http"
)

type FlightSimulatorInterface interface {
	ReadyzHandler(w http.ResponseWriter, r *http.Request)
	WSFlightsHandler(w http.ResponseWriter, r *http.Request)
}

func NewRouter(simulator FlightSimulatorInterface) *http.ServeMux {
	mux := http.NewServeMux()
	
	mux.HandleFunc("/healthz", HealthzHandler)
	mux.HandleFunc("/readyz", simulator.ReadyzHandler)
	mux.HandleFunc("/ws/flights", simulator.WSFlightsHandler)
	
	return mux
}