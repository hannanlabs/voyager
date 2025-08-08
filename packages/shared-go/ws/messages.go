package ws

import "github.com/hannan/voyager/shared-go/flight"

const (
	TypeInitialState  = "initial_state"
	TypeFlightUpdates = "flight_updates"
)

type InitialStateMessage struct {
	Type    string         `json:"type"`
	Flights []flight.State `json:"flights"`
}

type FlightUpdatesMessage struct {
	Type    string         `json:"type"`
	Flights []flight.State `json:"flights"`
}