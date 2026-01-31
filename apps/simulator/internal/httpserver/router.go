package httpserver

import (
	"net/http"

	"github.com/hannan/voyager/simulator/internal/sim"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

func NewRouter(simulator *sim.Simulator, airports *sim.AirportStore) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", HealthzHandler)
	mux.HandleFunc("/readyz", ReadyzHandler)
	mux.HandleFunc("/ws/flights", WSFlightsHandler(simulator))
	mux.HandleFunc("/geojson/airports", GeoJSONAirportsHandler(airports))
	mux.HandleFunc("/geojson/flights/route", GeoJSONFlightRouteHandler(simulator, airports))

	return otelhttp.NewHandler(CORSMiddleware(mux), "flight-simulator")
}
