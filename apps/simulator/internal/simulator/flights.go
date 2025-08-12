package simulator

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/shared-go/id"
)

const (
	SpeedTakeoff = 10000.0
	SpeedClimb   = 18000.0
	SpeedCruise  = 30000.0
	SpeedDescent = 21000.0
	SpeedLanding = 15000.0
)

func (fs *FlightSimulator) createFlight(from, to, airline, callSign string) *flight.State {
	fromPos := Airports[from]
	toPos := Airports[to]

	if from == to {
		return nil
	}

	currentPos := fromPos

	phase := flight.Takeoff
	altitude := 2000 + rand.Float64()*8000
	speed := SpeedTakeoff

	currentPos.Altitude = altitude

	bearing := CalculateBearing(fromPos, toPos)
	vel := SpeedToVelocity(speed, bearing)

	now := time.Now()
	departure := now
	arrival := departure.Add(6 * time.Hour)
	estimated := arrival.Add(time.Duration((rand.Float64()-0.5)*30) * time.Minute)

	distanceRemaining := CalculateDistance(currentPos, toPos)

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
		TraceID:            id.GenerateTraceID(),
	}
}

func (fs *FlightSimulator) UpdateFlights() {
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
		fromPos := Airports[f.DepartureAirport]
		toPos := Airports[f.ArrivalAirport]

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
			f.TraceID = id.GenerateTraceID()
			continue
		}

		f.Position = GreatCircleStep(f.Position, toPos, f.Speed, dt)

		f.Bearing = CalculateBearing(f.Position, toPos)

		f.Velocity = SpeedToVelocity(f.Speed, f.Bearing)

		f.Altitude = f.Position.Altitude

		f.DistanceRemaining = CalculateDistance(f.Position, toPos)
		totalDistance := CalculateDistance(fromPos, toPos)
		if totalDistance > 0.1 {
			f.Progress = 1.0 - (f.DistanceRemaining / totalDistance)
			f.Progress = math.Max(0, math.Min(1, f.Progress))
		}

		if f.DistanceRemaining < 50 {
			f.Speed = SpeedLanding
		}

		if f.Speed > 50 {
			hoursRemaining := f.DistanceRemaining / f.Speed
			estimatedArrival := now.Add(time.Duration(hoursRemaining * float64(time.Hour)))
			f.EstimatedArrival = estimatedArrival.Format(time.RFC3339)
		}

		newPhase := fs.determinePhase(f)
		if newPhase != f.Phase {
			f.Phase = newPhase
			switch f.Phase {
			case flight.Takeoff:
				f.Speed = SpeedTakeoff
			case flight.Climb:
				f.Speed = SpeedClimb
			case flight.Cruise:
				f.Speed = SpeedCruise
			case flight.Descent:
				f.Speed = SpeedDescent
			case flight.Landing:
				f.Speed = SpeedLanding
			case flight.Landed:
				f.Speed = 0
			}
		}

		if f.DistanceRemaining < 15.0 && f.Altitude < 500 && f.Speed < 15000 {
			f.Phase = flight.Landed
			f.DistanceRemaining = 0
			f.Progress = 1.0
		}

		f.LastComputedAt = now.Format(time.RFC3339)
		f.TraceID = id.GenerateTraceID()
	}

	for _, flightID := range toRemove {
		delete(fs.flights, flightID)
		delete(fs.landedFlights, flightID)
	}
}

func (fs *FlightSimulator) determinePhase(f *flight.State) flight.Phase {
	if f.Phase == flight.Landed {
		return flight.Landed
	}

	distanceRemaining := f.DistanceRemaining
	altitude := f.Altitude
	speed := f.Speed

	if f.Progress < 0.15 && altitude < 15000 && speed < 15000 {
		return flight.Takeoff
	}

	if f.Progress < 0.25 && altitude < 40000 {
		return flight.Climb
	}

	if (distanceRemaining < 50 || f.Progress > 0.90) && altitude < 8000 && speed < 21000 {
		return flight.Landing
	}

	if f.Progress > 0.75 && (altitude < 45000 || distanceRemaining < 200) {
		return flight.Descent
	}

	return flight.Cruise
}

func generateCallSign(airline string, flightNum int) string {
	prefixes := map[string]string{
		"United":    "UAL",
		"American":  "AAL",
		"Delta":     "DL",
		"Southwest": "SWA",
		"JetBlue":   "JBU",
		"Alaska":    "ASA",
	}

	prefix := prefixes[airline]
	if prefix == "" {
		prefix = "GEN"
	}

	return fmt.Sprintf("%s%d", prefix, flightNum)
}

func (fs *FlightSimulator) dynamicSpawn(now time.Time) {
	currentFlights := len(fs.flights)
	const targetFlights = 2000
	const fluctuationRange = 200
	const maxFlights = targetFlights + fluctuationRange // 2200

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

	if now.Sub(fs.lastSpawnAt) >= spawnInterval {
		fs.generateAirportBurst(burstSize)
		fs.lastSpawnAt = now
	}
}

func selectDeparture() string {
	if len(AirportCodes) == 0 {
		return ""
	}
	return AirportCodes[rand.Intn(len(AirportCodes))]
}

func selectArrival(departure string) string {
	if len(AirportCodes) <= 1 {
		return ""
	}

	maxRetries := 10
	for retry := 0; retry < maxRetries; retry++ {
		candidate := AirportCodes[rand.Intn(len(AirportCodes))]
		if candidate != departure {
			return candidate
		}
	}

	for _, code := range AirportCodes {
		if code != departure {
			return code
		}
	}
	return ""
}

func (fs *FlightSimulator) generateAirportBurst(numFlights int) {
	for i := 0; i < numFlights; i++ {
		departure := selectDeparture()
		if departure == "" {
			continue
		}

		arrival := selectArrival(departure)
		if arrival == "" {
			continue
		}

		airline := Airlines[rand.Intn(len(Airlines))]
		callSign := generateCallSign(airline, i+1)

		flightState := fs.createFlight(departure, arrival, airline, callSign)
		if flightState != nil {
			fs.flights[flightState.ID] = flightState
		}
	}
}
