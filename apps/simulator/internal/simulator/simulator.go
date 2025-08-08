package simulator

import (
	"sync"

	"github.com/gorilla/websocket"
)

type FlightSimulator struct {
	flights   map[string]*FlightState
	clients   map[*websocket.Conn]bool
	clientsMu sync.RWMutex
	updateHz  int
	isReady   bool
	readyMu   sync.RWMutex
}

func NewFlightSimulator(updateHz int) *FlightSimulator {
	sim := &FlightSimulator{
		flights:  make(map[string]*FlightState),
		clients:  make(map[*websocket.Conn]bool),
		updateHz: updateHz,
	}

	sim.generateSyntheticFlights()
	sim.setReady(true)

	return sim
}