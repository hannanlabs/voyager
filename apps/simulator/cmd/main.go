package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hannan/voyager/simulator/internal/httpserver"
	"github.com/hannan/voyager/simulator/internal/simulator"
)

func main() {
	updateHz := httpserver.GetUpdateHz()
	port := httpserver.GetPort()
	airportPath := httpserver.GetAirportsGeoJSONPath()
	geoJSONFlightsHz := httpserver.GetGeoJSONFlightsHz()

	log.Printf("Starting Flight Simulator WebSocket server on port %s with %d Hz updates", port, updateHz)

	repo := simulator.New()
	if err := repo.Load(airportPath); err != nil {
		log.Fatalf("Failed to load airports data: %v", err)
	}

	sim := simulator.NewFlightSimulator(updateHz, geoJSONFlightsHz, repo)

	router := httpserver.NewRouter(sim, repo)
	server := httpserver.NewServer(port, router)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go sim.Start(ctx)

	httpserver.SetReady(true)

	go func() {
		if err := httpserver.StartServer(server); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	log.Printf("Flight Simulator started successfully")
	log.Printf("Health endpoint: http://localhost:%s/healthz", port)
	log.Printf("Readiness endpoint: http://localhost:%s/readyz", port)
	log.Printf("WebSocket endpoint: ws://localhost:%s/ws/flights", port)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	cancel()

	if err := httpserver.ShutdownServer(server, 10*time.Second); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
}
