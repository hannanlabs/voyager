package simulator

import (
	"fmt"
	"math/rand"
	"time"
	
	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/shared-go/id"
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

func (fs *FlightSimulator) createFlight(from, to, airline, callSign string) *flight.State {
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

	return &flight.State{
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
		TraceID:            id.GenerateTraceID(),
	}
}

func (fs *FlightSimulator) UpdateFlights() {
	now := time.Now()

	for _, f := range fs.flights {
		f.Progress += rand.Float64() * 0.001
		if f.Progress > 1.0 {
			f.Progress = 1.0
		}

		fromPos := Airports[f.DepartureAirport]
		toPos := Airports[f.ArrivalAirport]
		f.Position = InterpolatePosition(fromPos, toPos, f.Progress)
		f.Position.Altitude = f.Altitude

		f.Position.Latitude += (rand.Float64() - 0.5) * 0.001
		f.Position.Longitude += (rand.Float64() - 0.5) * 0.001
		f.Position.Altitude += (rand.Float64() - 0.5) * 500

		f.Speed += (rand.Float64() - 0.5) * 10
		if f.Speed < 400 {
			f.Speed = 400
		}
		if f.Speed > 600 {
			f.Speed = 600
		}

		f.Velocity = SpeedToVelocity(f.Speed, f.Bearing)

		f.LastComputedAt = now.Format(time.RFC3339)
		f.TraceID = id.GenerateTraceID()

		if f.Progress < 0.1 {
			f.Phase = flight.Takeoff
		} else if f.Progress < 0.2 {
			f.Phase = flight.Climb
		} else if f.Progress < 0.8 {
			f.Phase = flight.Cruise
		} else if f.Progress < 0.95 {
			f.Phase = flight.Descent
		} else {
			f.Phase = flight.Landing
		}
	}
}