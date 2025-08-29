package core

import (
	"context"
	"log"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/simulator/internal/helpers"
)

type ClientManager interface {
	AddClient(conn *websocket.Conn)
	RemoveClient(conn *websocket.Conn)
	GetClients() []*websocket.Conn
	ClientCount() int
	SendInitialGeoJSONToClient(conn *websocket.Conn, featureCollection helpers.GeoJSONFeatureCollection)
	BroadcastToClients(data []byte)
}

type FlightManager interface {
	GetAllFlights() map[string]*flight.State
}

type FlightOperations interface {
	UpdateFlights(updateHz int)
}

type GeoJSONProcessor interface {
	BuildFlightsGeoJSON(flights map[string]*flight.State) helpers.GeoJSONFeatureCollection
	ShouldBroadcast(geoJSONFlightsHz int) bool
	CreateBroadcastMessage(featureCollection helpers.GeoJSONFeatureCollection) ([]byte, error)
}

type Orchestrator struct {
	config        *Config
	clientManager ClientManager
	flightManager FlightManager
	flightOps     FlightOperations
	geoProcessor  GeoJSONProcessor
}

func NewOrchestrator(config *Config, clientManager ClientManager, flightManager FlightManager, flightOps FlightOperations, geoProcessor GeoJSONProcessor) *Orchestrator {
	return &Orchestrator{
		config:        config,
		clientManager: clientManager,
		flightManager: flightManager,
		flightOps:     flightOps,
		geoProcessor:  geoProcessor,
	}
}

func (o *Orchestrator) Start(ctx context.Context) {
	helpers.StartTicker(ctx, o.config.UpdateHz, func() {
		o.UpdateFlights()
		o.BroadcastFlightsGeoJSON()
	})
}

func (o *Orchestrator) UpdateFlights() {
	o.flightOps.UpdateFlights(o.config.UpdateHz)
}

func (o *Orchestrator) BroadcastFlightsGeoJSON() {
	if o.clientManager.ClientCount() == 0 {
		return
	}

	if !o.geoProcessor.ShouldBroadcast(o.config.GeoJSONFlightsHz) {
		return
	}

	flights := o.flightManager.GetAllFlights()
	featureCollection := o.geoProcessor.BuildFlightsGeoJSON(flights)

	data, err := o.geoProcessor.CreateBroadcastMessage(featureCollection)
	if err != nil {
		log.Printf("Error creating broadcast message: %v", err)
		return
	}

	o.clientManager.BroadcastToClients(data)
}

func (o *Orchestrator) AddClient(conn *websocket.Conn) {
	o.clientManager.AddClient(conn)

	flights := o.flightManager.GetAllFlights()
	featureCollection := o.geoProcessor.BuildFlightsGeoJSON(flights)

	go o.clientManager.SendInitialGeoJSONToClient(conn, featureCollection)
}

func (o *Orchestrator) RemoveClient(conn *websocket.Conn) {
	o.clientManager.RemoveClient(conn)
}
