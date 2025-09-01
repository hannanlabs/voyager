package httpserver

import (
	"github.com/hannan/voyager/simulator/internal/telemetry"
	"net/http"
)

func HealthzHandler(w http.ResponseWriter, r *http.Request) {
	telemetry.LogInfo("Health check requested",
		"endpoint", "/healthz",
		"status", "200",
		"remote_addr", r.RemoteAddr)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func ReadyzHandler(w http.ResponseWriter, r *http.Request) {
	telemetry.LogInfo("Readiness check requested",
		"endpoint", "/readyz",
		"status", "200",
		"remote_addr", r.RemoteAddr)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Ready"))
}
