package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/hannan/voyager/shared-go/data"
	"github.com/hannan/voyager/simulator/internal/httpserver"
	"github.com/hannan/voyager/simulator/internal/simulator"
	"github.com/hannan/voyager/simulator/internal/simulator/components/airport"
	"github.com/hannan/voyager/simulator/internal/telemetry"
)

func main() {
	shutdownTracing := telemetry.InitTracing("flight-simulator")
	defer shutdownTracing()

	shutdownLogs := telemetry.InitLogs("flight-simulator")
	defer shutdownLogs()

	updateHz := data.UpdateHz
	port := data.ServerPort
	airportPath := data.AirportPath
	geoJSONFlightsHz := data.GeoJSONFlightsHz
	repo := airport.New()
	repo.Load(airportPath)

	sim := simulator.NewFlightSimulator(updateHz, geoJSONFlightsHz, repo)

	shutdownMetrics := telemetry.InitMetrics("flight-simulator", sim.FlightCount)
	defer shutdownMetrics()

	router := httpserver.NewRouter(sim, repo)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go sim.Start(ctx)

	go func() {
		if err := httpserver.StartServer(port, router); err != nil {
			telemetry.LogError("Server failed to start", err, "port", port)
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	telemetry.LogInfo("Flight Simulator started successfully",
		"port", port,
		"updateHz", updateHz,
		"geoJSONFlightsHz", geoJSONFlightsHz)
	log.Printf("Flight Simulator started successfully")
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	cancel()
}
