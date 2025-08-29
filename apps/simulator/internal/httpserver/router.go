package httpserver

import (
	"net/http"

	"github.com/hannan/voyager/simulator/internal/simulator"
	"github.com/hannan/voyager/simulator/internal/simulator/components/airport"
	httphandlers "github.com/hannan/voyager/simulator/internal/transport/http"
	wshandlers "github.com/hannan/voyager/simulator/internal/transport/websocket"
)

func NewRouter(sim *simulator.FlightSimulator, repo *airport.Repository) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", HealthzHandler)
	mux.HandleFunc("/readyz", ReadyzHandler)
	mux.HandleFunc("/ws/flights", wshandlers.WSFlightsHandler(sim))
	mux.HandleFunc("/geojson/airports", httphandlers.GeoJSONAirportsHandler(repo))
	mux.HandleFunc("/geojson/flights/route", httphandlers.GeoJSONFlightRouteHandler(sim, repo))

	return CORSMiddleware(mux)
}
