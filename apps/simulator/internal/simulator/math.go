package simulator

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

	earthRadiusNM := 3440.065 // Earth radius in nautical miles
	return earthRadiusNM * c
}

func InterpolatePosition(from, to flight.Position, progress float64) flight.Position {
	return flight.Position{
		Latitude:  from.Latitude + (to.Latitude-from.Latitude)*progress,
		Longitude: from.Longitude + (to.Longitude-from.Longitude)*progress,
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