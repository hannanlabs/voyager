package simulator

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/hannan/voyager/shared-go/data"
)

func (fs *FlightSimulator) dynamicSpawn(now time.Time) {
	currentFlights := len(fs.flights)
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

	if now.Sub(fs.lastSpawnAt) >= spawnInterval {
		fs.generateAirportBurst(burstSize)
		fs.lastSpawnAt = now
	}
}

func (fs *FlightSimulator) generateAirportBurst(numFlights int) {
	for i := 0; i < numFlights; i++ {
		if len(fs.airports.Codes) <= 1 {
			continue
		}

		departure := fs.airports.Codes[rand.Intn(len(fs.airports.Codes))]
		arrival := fs.airports.Codes[rand.Intn(len(fs.airports.Codes))]

		for arrival == departure {
			arrival = fs.airports.Codes[rand.Intn(len(fs.airports.Codes))]
		}

		airlineData := data.Airlines[rand.Intn(len(data.Airlines))]
		callSign := fmt.Sprintf("%s%d", airlineData.ICAOCode, i+1)

		flightState := fs.createFlight(departure, arrival, airlineData.Name, callSign)
		if flightState != nil {
			fs.flights[flightState.ID] = flightState
		}
	}
}
