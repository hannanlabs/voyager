package flight

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/hannan/voyager/shared-go/data"
	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/simulator/internal/helpers"
)

type Operations struct {
	manager       *Manager
	landedFlights map[string]time.Time
	lastTickAt    time.Time
	lastSpawnAt   time.Time
	airports      AirportRepository
}

type AirportRepository interface {
	GetPositions() map[string]flight.Position
	GetCodes() []string
}

func NewOperations(manager *Manager, airports AirportRepository) *Operations {
	now := time.Now()
	return &Operations{
		manager:       manager,
		landedFlights: make(map[string]time.Time),
		lastTickAt:    now,
		lastSpawnAt:   now,
		airports:      airports,
	}
}

func (o *Operations) CreateFlight(from, to, airline, callSign string) *flight.State {
	positions := o.airports.GetPositions()
	fromPos := positions[from]
	toPos := positions[to]

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

func (o *Operations) UpdateFlights(updateHz int) {
	now := time.Now()
	dt := now.Sub(o.lastTickAt).Seconds()
	o.lastTickAt = now

	if dt > 5.0 {
		dt = 1.0 / float64(updateHz)
	}
	if dt < 0.001 {
		dt = 0.001
	}

	o.DynamicSpawn(now)

	landedTTL := 10 * time.Second
	var toRemove []string

	flights := o.manager.GetAllFlights()
	positions := o.airports.GetPositions()

	for flightID, f := range flights {
		fromPos := positions[f.DepartureAirport]
		toPos := positions[f.ArrivalAirport]

		if f.Phase == flight.Landed {
			if landedAt, exists := o.landedFlights[flightID]; exists {
				if now.Sub(landedAt) > landedTTL {
					toRemove = append(toRemove, flightID)
					continue
				}
			} else {
				o.landedFlights[flightID] = now
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

		newPhase := o.calculateFlightPhase(f)
		if newPhase != f.Phase {
			f.Phase = newPhase
			f.Speed = o.getSpeedForPhase(f.Phase)
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
		o.manager.RemoveFlight(flightID)
		delete(o.landedFlights, flightID)
	}
}

func (o *Operations) calculateFlightPhase(f *flight.State) flight.Phase {
	if f.Phase == flight.Landed {
		return flight.Landed
	} else if f.Progress < 0.15 && f.Altitude < 15000 && f.Speed < 15000 {
		return flight.Takeoff
	} else if f.Progress < 0.25 && f.Altitude < 40000 {
		return flight.Climb
	} else if (f.DistanceRemaining < 50 || f.Progress > 0.90) && f.Altitude < 8000 && f.Speed < 21000 {
		return flight.Landing
	} else if f.Progress > 0.75 && (f.Altitude < 45000 || f.DistanceRemaining < 200) {
		return flight.Descent
	} else {
		return flight.Cruise
	}
}

func (o *Operations) getSpeedForPhase(phase flight.Phase) float64 {
	switch phase {
	case flight.Takeoff:
		return data.SpeedTakeoff
	case flight.Climb:
		return data.SpeedClimb
	case flight.Cruise:
		return data.SpeedCruise
	case flight.Descent:
		return data.SpeedDescent
	case flight.Landing:
		return data.SpeedLanding
	case flight.Landed:
		return 0
	default:
		return data.SpeedCruise
	}
}

func (o *Operations) DynamicSpawn(now time.Time) {
	currentFlights := o.manager.FlightCount()
	const targetFlights = 2000
	const fluctuationRange = 200
	const maxFlights = targetFlights + fluctuationRange

	if currentFlights >= maxFlights {
		return
	}

	var spawnInterval time.Duration
	var burstSize int

	if currentFlights < targetFlights {
		progress := float64(currentFlights) / float64(targetFlights)
		spawnInterval = time.Duration(5+15*progress) * time.Second
		burstSize = int(30 - 25*progress + rand.Float64()*10)
	} else {
		spawnInterval = 30 * time.Second
		burstSize = int(5 + rand.Float64()*10)
	}

	if now.Sub(o.lastSpawnAt) >= spawnInterval {
		o.GenerateAirportBurst(burstSize)
		o.lastSpawnAt = now
	}
}

func (o *Operations) GenerateAirportBurst(numFlights int) {
	codes := o.airports.GetCodes()

	for i := 0; i < numFlights; i++ {
		if len(codes) <= 1 {
			continue
		}

		departure := codes[rand.Intn(len(codes))]
		arrival := codes[rand.Intn(len(codes))]

		for arrival == departure {
			arrival = codes[rand.Intn(len(codes))]
		}

		airlineData := data.Airlines[rand.Intn(len(data.Airlines))]
		callSign := fmt.Sprintf("%s%d", airlineData.ICAOCode, i+1)

		flightState := o.CreateFlight(departure, arrival, airlineData.Name, callSign)
		if flightState != nil {
			o.manager.AddFlight(flightState)
		}
	}
}
