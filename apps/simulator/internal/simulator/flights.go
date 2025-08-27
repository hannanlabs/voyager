package simulator

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/hannan/voyager/shared-go/data"
	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/simulator/internal/helpers"
)

func (fs *FlightSimulator) createFlight(from, to, airline, callSign string) *flight.State {
	fromPos := fs.airports.Positions[from]
	toPos := fs.airports.Positions[to]

	if from == to {
		return nil
	}

	currentPos := fromPos

	phase := flight.Takeoff
	altitude := 2000 + rand.Float64()*8000
	speed := data.SpeedTakeoff

	currentPos.Altitude = altitude

	bearing := helpers.CalculateBearing(fromPos, toPos)
	vel := helpers.SpeedToVelocity(speed, bearing)

	now := time.Now()
	departure := now
	arrival := departure.Add(6 * time.Hour)
	estimated := arrival.Add(time.Duration((rand.Float64()-0.5)*30) * time.Minute)

	distanceRemaining := helpers.CalculateDistance(currentPos, toPos)

	return &flight.State{
		ID:                 fmt.Sprintf("%s-%s-%s", callSign, from, to),
		CallSign:           callSign,
		Airline:            airline,
		DepartureAirport:   from,
		ArrivalAirport:     to,
		Phase:              phase,
		Position:           currentPos,
		Velocity:           vel,
		Bearing:            bearing,
		Speed:              speed,
		Altitude:           altitude,
		Progress:           0.0,
		DistanceRemaining:  distanceRemaining,
		ScheduledDeparture: departure.Format(time.RFC3339),
		ScheduledArrival:   arrival.Format(time.RFC3339),
		EstimatedArrival:   estimated.Format(time.RFC3339),
		LastComputedAt:     now.Format(time.RFC3339),
		TraceID:            helpers.GenerateTraceID(),
	}
}

func (fs *FlightSimulator) UpdateFlights() {
	fs.flightsMu.Lock()
	defer fs.flightsMu.Unlock()

	now := time.Now()
	dt := now.Sub(fs.lastTickAt).Seconds()
	fs.lastTickAt = now

	if dt > 5.0 {
		dt = 1.0 / float64(fs.updateHz)
	}
	if dt < 0.001 {
		dt = 0.001
	}

	fs.dynamicSpawn(now)

	landedTTL := 10 * time.Second

	var toRemove []string

	for flightID, f := range fs.flights {
		fromPos := fs.airports.Positions[f.DepartureAirport]
		toPos := fs.airports.Positions[f.ArrivalAirport]

		if f.Phase == flight.Landed {
			if landedAt, exists := fs.landedFlights[flightID]; exists {
				if now.Sub(landedAt) > landedTTL {
					toRemove = append(toRemove, flightID)
					continue
				}
			} else {
				fs.landedFlights[flightID] = now
			}
			f.LastComputedAt = now.Format(time.RFC3339)
			f.TraceID = helpers.GenerateTraceID()
			continue
		}

		f.Position = helpers.GreatCircleStep(f.Position, toPos, f.Speed, dt)

		f.Bearing = helpers.CalculateBearing(f.Position, toPos)

		f.Velocity = helpers.SpeedToVelocity(f.Speed, f.Bearing)

		f.Altitude = f.Position.Altitude

		f.DistanceRemaining = helpers.CalculateDistance(f.Position, toPos)
		totalDistance := helpers.CalculateDistance(fromPos, toPos)
		if totalDistance > 0.1 {
			f.Progress = 1.0 - (f.DistanceRemaining / totalDistance)
			f.Progress = math.Max(0, math.Min(1, f.Progress))
		}

		if f.DistanceRemaining < 50 {
			f.Speed = data.SpeedLanding
		}

		if f.Speed > 50 {
			hoursRemaining := f.DistanceRemaining / f.Speed
			estimatedArrival := now.Add(time.Duration(hoursRemaining * float64(time.Hour)))
			f.EstimatedArrival = estimatedArrival.Format(time.RFC3339)
		}

		var newPhase flight.Phase
		if f.Phase == flight.Landed {
			newPhase = flight.Landed
		} else if f.Progress < 0.15 && f.Altitude < 15000 && f.Speed < 15000 {
			newPhase = flight.Takeoff
		} else if f.Progress < 0.25 && f.Altitude < 40000 {
			newPhase = flight.Climb
		} else if (f.DistanceRemaining < 50 || f.Progress > 0.90) && f.Altitude < 8000 && f.Speed < 21000 {
			newPhase = flight.Landing
		} else if f.Progress > 0.75 && (f.Altitude < 45000 || f.DistanceRemaining < 200) {
			newPhase = flight.Descent
		} else {
			newPhase = flight.Cruise
		}

		if newPhase != f.Phase {
			f.Phase = newPhase
			switch f.Phase {
			case flight.Takeoff:
				f.Speed = data.SpeedTakeoff
			case flight.Climb:
				f.Speed = data.SpeedClimb
			case flight.Cruise:
				f.Speed = data.SpeedCruise
			case flight.Descent:
				f.Speed = data.SpeedDescent
			case flight.Landing:
				f.Speed = data.SpeedLanding
			case flight.Landed:
				f.Speed = 0
			}
		}

		if (f.DistanceRemaining < 15.0 && f.Altitude < 500 && f.Speed < 15000) || f.Progress >= 1.0 {
			f.Phase = flight.Landed
			f.DistanceRemaining = 0
			f.Progress = 1.0
		}

		f.LastComputedAt = now.Format(time.RFC3339)
		f.TraceID = helpers.GenerateTraceID()
	}

	for _, flightID := range toRemove {
		delete(fs.flights, flightID)
		delete(fs.landedFlights, flightID)
	}
}
