package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/hannan/voyager/shared-go/data"
	"github.com/hannan/voyager/simulator/internal/simulator"
	"github.com/hannan/voyager/simulator/internal/telemetry"
)

func main() {
	shutdownTracing := telemetry.InitTracing("flight-simulator")
	defer shutdownTracing()

	shutdownLogs := telemetry.InitLogs("flight-simulator")
	defer shutdownLogs()

	airports := simulator.NewAirportStore()
	airports.Load(data.AirportPath)

	sim := simulator.New(data.UpdateHz, data.GeoJSONFlightsHz, airports)

	shutdownMetrics := telemetry.InitMetrics("flight-simulator", sim.FlightCount)
	defer shutdownMetrics()

	router := simulator.NewRouter(sim, airports)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go sim.Start(ctx)

	go func() {
		if err := simulator.StartServer(data.ServerPort, router); err != nil {
			telemetry.LogError("Server failed to start", err, "port", data.ServerPort)
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	telemetry.LogInfo("Flight Simulator started successfully",
		"port", data.ServerPort,
		"updateHz", data.UpdateHz,
		"geoJSONFlightsHz", data.GeoJSONFlightsHz)
	log.Printf("Flight Simulator started successfully")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	cancel()
}
