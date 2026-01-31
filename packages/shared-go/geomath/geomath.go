package geomath

import (
	"math"

	"github.com/hannan/voyager/shared-go/flight"
)

func CalculateBearing(from, to flight.Position) float64 {
	lat1, lat2 := from.Latitude*math.Pi/180, to.Latitude*math.Pi/180
	deltaLon := (to.Longitude - from.Longitude) * math.Pi / 180
	y := math.Sin(deltaLon) * math.Cos(lat2)
	x := math.Cos(lat1)*math.Sin(lat2) - math.Sin(lat1)*math.Cos(lat2)*math.Cos(deltaLon)
	return math.Mod(math.Atan2(y, x)*180/math.Pi+360, 360)
}

func CalculateDistance(from, to flight.Position) float64 {
	lat1, lat2 := from.Latitude*math.Pi/180, to.Latitude*math.Pi/180
	deltaLat := (to.Latitude - from.Latitude) * math.Pi / 180
	deltaLon := (to.Longitude - from.Longitude) * math.Pi / 180
	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) + math.Cos(lat1)*math.Cos(lat2)*math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	return 3440.065 * 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}

func InterpolatePosition(from, to flight.Position, progress float64) flight.Position {
	lat1, lon1 := from.Latitude*math.Pi/180, from.Longitude*math.Pi/180
	lat2, lon2 := to.Latitude*math.Pi/180, to.Longitude*math.Pi/180
	deltaLat, deltaLon := lat2-lat1, lon2-lon1
	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) + math.Cos(lat1)*math.Cos(lat2)*math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	d := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	if d < 1e-6 {
		return flight.Position{
			Latitude:  from.Latitude + (to.Latitude-from.Latitude)*progress,
			Longitude: from.Longitude + (to.Longitude-from.Longitude)*progress,
			Altitude:  from.Altitude,
		}
	}
	A, B := math.Sin((1-progress)*d)/math.Sin(d), math.Sin(progress*d)/math.Sin(d)
	x := A*math.Cos(lat1)*math.Cos(lon1) + B*math.Cos(lat2)*math.Cos(lon2)
	y := A*math.Cos(lat1)*math.Sin(lon1) + B*math.Cos(lat2)*math.Sin(lon2)
	z := A*math.Sin(lat1) + B*math.Sin(lat2)
	return flight.Position{
		Latitude:  math.Atan2(z, math.Sqrt(x*x+y*y)) * 180 / math.Pi,
		Longitude: math.Atan2(y, x) * 180 / math.Pi,
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
