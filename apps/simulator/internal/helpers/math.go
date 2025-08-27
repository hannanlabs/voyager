package helpers

import (
	"math"

	"github.com/hannan/voyager/shared-go/flight"
)

func CalculateBearing(from, to flight.Position) float64 {
	lat1 := from.Latitude * math.Pi / 180
	lat2 := to.Latitude * math.Pi / 180
	deltaLon := (to.Longitude - from.Longitude) * math.Pi / 180

	y := math.Sin(deltaLon) * math.Cos(lat2)
	x := math.Cos(lat1)*math.Sin(lat2) - math.Sin(lat1)*math.Cos(lat2)*math.Cos(deltaLon)

	bearing := math.Atan2(y, x)
	return math.Mod(bearing*180/math.Pi+360, 360)
}

func CalculateDistance(from, to flight.Position) float64 {
	lat1 := from.Latitude * math.Pi / 180
	lat2 := to.Latitude * math.Pi / 180
	deltaLat := (to.Latitude - from.Latitude) * math.Pi / 180
	deltaLon := (to.Longitude - from.Longitude) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	earthRadiusNM := 3440.065
	return earthRadiusNM * c
}

func InterpolatePosition(from, to flight.Position, progress float64) flight.Position {
	lat1 := from.Latitude * math.Pi / 180
	lon1 := from.Longitude * math.Pi / 180
	lat2 := to.Latitude * math.Pi / 180
	lon2 := to.Longitude * math.Pi / 180

	deltaLat := lat2 - lat1
	deltaLon := lon2 - lon1
	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	angularDistance := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	if angularDistance < 1e-6 {
		return flight.Position{
			Latitude:  from.Latitude + (to.Latitude-from.Latitude)*progress,
			Longitude: from.Longitude + (to.Longitude-from.Longitude)*progress,
			Altitude:  from.Altitude,
		}
	}

	A := math.Sin((1-progress)*angularDistance) / math.Sin(angularDistance)
	B := math.Sin(progress*angularDistance) / math.Sin(angularDistance)

	x := A*math.Cos(lat1)*math.Cos(lon1) + B*math.Cos(lat2)*math.Cos(lon2)
	y := A*math.Cos(lat1)*math.Sin(lon1) + B*math.Cos(lat2)*math.Sin(lon2)
	z := A*math.Sin(lat1) + B*math.Sin(lat2)

	resultLat := math.Atan2(z, math.Sqrt(x*x+y*y))
	resultLon := math.Atan2(y, x)

	return flight.Position{
		Latitude:  resultLat * 180 / math.Pi,
		Longitude: resultLon * 180 / math.Pi,
		Altitude:  from.Altitude,
	}
}

func SpeedToVelocity(speed, bearing float64) flight.Velocity {
	bearingRad := bearing * math.Pi / 180
	return flight.Velocity{
		X: speed * math.Sin(bearingRad),
		Y: speed * math.Cos(bearingRad),
		Z: 0,
	}
}

func GreatCircleStep(current, destination flight.Position, groundSpeed, dt float64) flight.Position {
	distance := CalculateDistance(current, destination)
	if distance < 0.1 {
		return destination
	}

	stepDistance := groundSpeed * dt / 3600.0

	if groundSpeed > 10000 {
		stepDistance *= 2.0
	}

	if stepDistance >= distance {
		return destination
	}

	progress := stepDistance / distance
	return InterpolatePosition(current, destination, progress)
}

func GenerateGreatCircleCoordinates(from, to flight.Position, n int) [][]float64 {
	coordinates := make([][]float64, n+1)

	for i := 0; i <= n; i++ {
		progress := float64(i) / float64(n)
		pos := InterpolatePosition(from, to, progress)
		coordinates[i] = []float64{pos.Longitude, pos.Latitude}
	}

	return coordinates
}
