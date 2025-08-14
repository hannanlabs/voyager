package simulator

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/simulator/internal/httpserver"
)

type FlightSimulator struct {
	flights          map[string]*flight.State
	flightsMu        sync.RWMutex
	clients          map[*websocket.Conn]bool
	clientsMu        sync.RWMutex
	updateHz         int
	geoJSONFlightsHz int
	lastTickAt       time.Time
	lastGeoJSONAt    time.Time
	landedFlights    map[string]time.Time
	lastSpawnAt      time.Time
	geoJSONSeq       int64
}

func NewFlightSimulator(updateHz int) (*FlightSimulator, error) {
	airportPath := httpserver.GetAirportsGeoJSONPath()
	if err := InitializeGlobalAirportData(airportPath); err != nil {
		return nil, err
	}

	geoJSONFlightsHz := httpserver.GetGeoJSONFlightsHz()

	now := time.Now()
	sim := &FlightSimulator{
		flights:          make(map[string]*flight.State),
		clients:          make(map[*websocket.Conn]bool),
		updateHz:         updateHz,
		geoJSONFlightsHz: geoJSONFlightsHz,
		lastTickAt:       now,
		lastGeoJSONAt:    now,
		landedFlights:    make(map[string]time.Time),
		lastSpawnAt:      now,
		geoJSONSeq:       0,
	}

	sim.generateAirportBurst(50)

	return sim, nil
}
