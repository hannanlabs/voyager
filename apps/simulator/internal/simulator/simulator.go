package simulator

import (
	"context"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/simulator/internal/simulator/components/airport"
	"github.com/hannan/voyager/simulator/internal/simulator/components/client"
	"github.com/hannan/voyager/simulator/internal/simulator/components/core"
	flightcomponent "github.com/hannan/voyager/simulator/internal/simulator/components/flight"
	"github.com/hannan/voyager/simulator/internal/simulator/components/geojson"
)

// ============================================================================
// Type Definitions
// ============================================================================

type FlightSimulator struct {
	orchestrator  *core.Orchestrator
	flightManager *flightcomponent.Manager
	airports      *airport.Repository
}

// ============================================================================
// Constructor and Core Operations
// ============================================================================

func NewFlightSimulator(updateHz int, geoJSONFlightsHz int, airports *airport.Repository) *FlightSimulator {
	// Create components
	config := core.NewConfig(updateHz, geoJSONFlightsHz)
	clientManager := client.NewManager()
	flightManager := flightcomponent.NewManager()
	geoProcessor := geojson.NewProcessor(updateHz)

	// Create flight operations with airport repository
	flightOps := flightcomponent.NewOperations(flightManager, airports)

	// Create orchestrator
	orchestrator := core.NewOrchestrator(config, clientManager, flightManager, flightOps, geoProcessor)

	sim := &FlightSimulator{
		orchestrator:  orchestrator,
		flightManager: flightManager,
		airports:      airports,
	}

	// Initial flight generation
	flightOps.GenerateAirportBurst(50)

	return sim
}

func (fs *FlightSimulator) Start(ctx context.Context) {
	fs.orchestrator.Start(ctx)
}

// ============================================================================
// Flight Management
// ============================================================================

func (fs *FlightSimulator) GetFlightByID(flightID string) (*flight.State, bool) {
	return fs.flightManager.GetFlightByID(flightID)
}

// ============================================================================
// Client Management
// ============================================================================

func (fs *FlightSimulator) AddClient(conn *websocket.Conn) {
	fs.orchestrator.AddClient(conn)
}

func (fs *FlightSimulator) RemoveClient(conn *websocket.Conn) {
	fs.orchestrator.RemoveClient(conn)
}

// ============================================================================
// Metrics
// ============================================================================

func (fs *FlightSimulator) FlightCount() int {
	return fs.flightManager.FlightCount()
}
