package simulator

import (
	"fmt"
	"math/rand"
	"time"
)

func (fs *FlightSimulator) generateSyntheticFlights() {
	routes := []struct {
		from, to, airline, callSign string
	}{
		{"JFK", "LAX", "United", "UAL101"},
		{"LAX", "SEA", "Delta", "DL205"},
		{"ATL", "ORD", "American", "AAL350"},
		{"SEA", "DEN", "Alaska", "ASA102"},
		{"ORD", "JFK", "United", "UAL501"},
		{"DEN", "ATL", "Southwest", "SWA220"},
	}

	for _, route := range routes {
		flight := fs.createFlight(route.from, route.to, route.airline, route.callSign)
		fs.flights[flight.ID] = flight
	}
}

func (fs *FlightSimulator) createFlight(from, to, airline, callSign string) *FlightState {
	fromPos := Airports[from]
	toPos := Airports[to]

	bearing := CalculateBearing(fromPos, toPos)

	progress := 0.1 + rand.Float64()*0.8

	currentPos := InterpolatePosition(fromPos, toPos, progress)

	cruiseAltitude := 35000 + rand.Float64()*10000
	currentPos.Altitude = cruiseAltitude

	speed := 450 + rand.Float64()*100

	vel := SpeedToVelocity(speed, bearing)

	now := time.Now()
	departure := now.Add(-time.Duration(progress*6) * time.Hour)
	arrival := departure.Add(6 * time.Hour)
	estimated := arrival.Add(time.Duration((rand.Float64()-0.5)*30) * time.Minute)

	return &FlightState{
		ID:                 fmt.Sprintf("%s-%s-%s", callSign, from, to),
		CallSign:           callSign,
		Airline:            airline,
		DepartureAirport:   from,
		ArrivalAirport:     to,
		Phase:              Phases[rand.Intn(len(Phases))],
		Position:           currentPos,
		Velocity:           vel,
		Bearing:            bearing,
		Speed:              speed,
		Altitude:           cruiseAltitude,
		Progress:           progress,
		ScheduledDeparture: departure.Format(time.RFC3339),
		ScheduledArrival:   arrival.Format(time.RFC3339),
		EstimatedArrival:   estimated.Format(time.RFC3339),
		LastComputedAt:     now.Format(time.RFC3339),
		TraceID:            GenerateTraceID(),
	}
}

func (fs *FlightSimulator) UpdateFlights() {
	now := time.Now()

	for _, flight := range fs.flights {
		flight.Progress += rand.Float64() * 0.001
		if flight.Progress > 1.0 {
			flight.Progress = 1.0
		}

		fromPos := Airports[flight.DepartureAirport]
		toPos := Airports[flight.ArrivalAirport]
		flight.Position = InterpolatePosition(fromPos, toPos, flight.Progress)
		flight.Position.Altitude = flight.Altitude

		flight.Position.Latitude += (rand.Float64() - 0.5) * 0.001
		flight.Position.Longitude += (rand.Float64() - 0.5) * 0.001
		flight.Position.Altitude += (rand.Float64() - 0.5) * 500

		flight.Speed += (rand.Float64() - 0.5) * 10
		if flight.Speed < 400 {
			flight.Speed = 400
		}
		if flight.Speed > 600 {
			flight.Speed = 600
		}

		flight.Velocity = SpeedToVelocity(flight.Speed, flight.Bearing)

		flight.LastComputedAt = now.Format(time.RFC3339)
		flight.TraceID = GenerateTraceID()

		if flight.Progress < 0.1 {
			flight.Phase = "takeoff"
		} else if flight.Progress < 0.2 {
			flight.Phase = "climb"
		} else if flight.Progress < 0.8 {
			flight.Phase = "cruise"
		} else if flight.Progress < 0.95 {
			flight.Phase = "descent"
		} else {
			flight.Phase = "landing"
		}
	}
}