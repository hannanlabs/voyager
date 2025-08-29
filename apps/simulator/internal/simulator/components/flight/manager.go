package flight

import (
	"sync"

	"github.com/hannan/voyager/shared-go/flight"
)

type Manager struct {
	flights   map[string]*flight.State
	flightsMu sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		flights: make(map[string]*flight.State),
	}
}

func (m *Manager) GetFlightByID(flightID string) (*flight.State, bool) {
	m.flightsMu.RLock()
	defer m.flightsMu.RUnlock()

	flightState, exists := m.flights[flightID]
	return flightState, exists
}

func (m *Manager) GetAllFlights() map[string]*flight.State {
	m.flightsMu.RLock()
	defer m.flightsMu.RUnlock()

	flights := make(map[string]*flight.State, len(m.flights))
	for id, flight := range m.flights {
		flights[id] = flight
	}
	return flights
}

func (m *Manager) AddFlight(f *flight.State) {
	m.flightsMu.Lock()
	defer m.flightsMu.Unlock()
	m.flights[f.ID] = f
}

func (m *Manager) RemoveFlight(flightID string) {
	m.flightsMu.Lock()
	defer m.flightsMu.Unlock()
	delete(m.flights, flightID)
}

func (m *Manager) FlightCount() int {
	m.flightsMu.RLock()
	defer m.flightsMu.RUnlock()
	return len(m.flights)
}
