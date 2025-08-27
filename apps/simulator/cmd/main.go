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
)

func main() {
	updateHz := data.UpdateHz
	port := data.ServerPort
	airportPath := data.AirportPath
	geoJSONFlightsHz := data.GeoJSONFlightsHz
	repo := simulator.New()
	repo.Load(airportPath)

	sim := simulator.NewFlightSimulator(updateHz, geoJSONFlightsHz, repo)

	router := httpserver.NewRouter(sim, repo)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go sim.Start(ctx)

	go func() {
		if err := httpserver.StartServer(port, router); err != nil {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	log.Printf("Flight Simulator started successfully")
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	cancel()
}
