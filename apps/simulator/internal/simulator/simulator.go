package simulator

import (
	"sync"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/shared-go/flight"
)

type FlightSimulator struct {
	flights   map[string]*flight.State
	clients   map[*websocket.Conn]bool
	clientsMu sync.RWMutex
	updateHz  int
	isReady   bool
	readyMu   sync.RWMutex
}

func NewFlightSimulator(updateHz int) *FlightSimulator {
	sim := &FlightSimulator{
		flights:  make(map[string]*flight.State),
		clients:  make(map[*websocket.Conn]bool),
		updateHz: updateHz,
	}

	sim.generateSyntheticFlights()
	sim.setReady(true)

	return sim
}