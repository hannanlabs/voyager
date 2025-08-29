package core

import (
	"time"
)

type Config struct {
	UpdateHz         int
	GeoJSONFlightsHz int
	LastTickAt       time.Time
	LandedFlights    map[string]time.Time
	LastSpawnAt      time.Time
}

func NewConfig(updateHz, geoJSONFlightsHz int) *Config {
	now := time.Now()
	return &Config{
		UpdateHz:         updateHz,
		GeoJSONFlightsHz: geoJSONFlightsHz,
		LastTickAt:       now,
		LandedFlights:    make(map[string]time.Time),
		LastSpawnAt:      now,
	}
}
