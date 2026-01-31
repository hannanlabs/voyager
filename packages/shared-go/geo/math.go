package geo

import (
	"math"

	"github.com/hannan/voyager/shared-go/flight"
	"github.com/paulmach/orb"
	"github.com/paulmach/orb/geo"
)

func CalculateBearing(from, to flight.Position) float64 {
	p1 := orb.Point{from.Longitude, from.Latitude}
	p2 := orb.Point{to.Longitude, to.Latitude}
	return geo.Bearing(p1, p2)
}

func CalculateDistance(from, to flight.Position) float64 {
	p1 := orb.Point{from.Longitude, from.Latitude}
	p2 := orb.Point{to.Longitude, to.Latitude}
	return geo.Distance(p1, p2) / 1852.0
}

func InterpolatePosition(from, to flight.Position, progress float64) flight.Position {
	p1 := orb.Point{from.Longitude, from.Latitude}
	p2 := orb.Point{to.Longitude, to.Latitude}

	bearing := geo.Bearing(p1, p2)
	totalDist := geo.Distance(p1, p2)
	result := geo.PointAtBearingAndDistance(p1, bearing, totalDist*progress)

	return flight.Position{
		Latitude:  result.Lat(),
		Longitude: result.Lon(),
		Altitude:  from.Altitude,
	}
}

func SpeedToVelocity(speed, bearing float64) flight.Velocity {
	rad := bearing * math.Pi / 180
	return flight.Velocity{X: speed * math.Sin(rad), Y: speed * math.Cos(rad), Z: 0}
}

func GreatCircleStep(current, dest flight.Position, speed, dt float64) flight.Position {
	dist := CalculateDistance(current, dest)
	if dist < 0.1 {
		return dest
	}
	step := speed * dt / 3600.0
	if speed > 10000 {
		step *= 2.0
	}
	if step >= dist {
		return dest
	}
	return InterpolatePosition(current, dest, step/dist)
}

func GenerateGreatCircleCoordinates(from, to flight.Position, n int) [][]float64 {
	coords := make([][]float64, n+1)
	for i := 0; i <= n; i++ {
		pos := InterpolatePosition(from, to, float64(i)/float64(n))
		coords[i] = []float64{pos.Longitude, pos.Latitude}
	}
	return coords
}
