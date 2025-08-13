package simulator

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/shared-go/flight"
)

type FlightSimulator struct {
	flights       map[string]*flight.State
	flightsMu     sync.RWMutex
	clients       map[*websocket.Conn]bool
	clientsMu     sync.RWMutex
	updateHz      int
	isReady       bool
	readyMu       sync.RWMutex
	lastTickAt    time.Time
	landedFlights map[string]time.Time
	lastSpawnAt   time.Time
}

func NewFlightSimulator(updateHz int) (*FlightSimulator, error) {
	if err := InitializeAirportData(); err != nil {
		return nil, err
	}

	now := time.Now()
	sim := &FlightSimulator{
		flights:       make(map[string]*flight.State),
		clients:       make(map[*websocket.Conn]bool),
		updateHz:      updateHz,
		lastTickAt:    now,
		landedFlights: make(map[string]time.Time),
		lastSpawnAt:   now,
	}

	sim.generateAirportBurst(50)

	return sim, nil
}
