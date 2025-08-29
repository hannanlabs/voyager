package geojson

import (
	"encoding/json"
	"log"
	"sync/atomic"
	"time"

	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/simulator/internal/helpers"
)

type Processor struct {
	lastGeoJSONAt time.Time
	geoJSONSeq    int64
	updateHz      int
}

func NewProcessor(updateHz int) *Processor {
	return &Processor{
		lastGeoJSONAt: time.Now(),
		geoJSONSeq:    0,
		updateHz:      updateHz,
	}
}

func (p *Processor) BuildFlightsGeoJSON(flights map[string]*flight.State) helpers.GeoJSONFeatureCollection {
	features := make([]helpers.GeoJSONFeature, 0, len(flights))
	for _, f := range flights {
		feature := helpers.NewPointFeature(
			f.Position.Longitude,
			f.Position.Latitude,
			f.Position.Altitude,
			map[string]interface{}{
				"id":                 f.ID,
				"callSign":           f.CallSign,
				"airline":            f.Airline,
				"departureAirport":   f.DepartureAirport,
				"arrivalAirport":     f.ArrivalAirport,
				"phase":              string(f.Phase),
				"bearing":            f.Bearing,
				"speed":              f.Speed,
				"altitude":           f.Position.Altitude,
				"progress":           f.Progress,
				"distanceRemaining":  f.DistanceRemaining,
				"scheduledDeparture": f.ScheduledDeparture,
				"scheduledArrival":   f.ScheduledArrival,
				"estimatedArrival":   f.EstimatedArrival,
				"lastComputedAt":     f.LastComputedAt,
				"traceID":            f.TraceID,
			},
		)
		features = append(features, feature)
	}

	return helpers.NewFeatureCollection(features)
}

func (p *Processor) ShouldBroadcast(geoJSONFlightsHz int) bool {
	now := time.Now()
	interval := time.Duration(1000000000/geoJSONFlightsHz) * time.Nanosecond

	if now.Sub(p.lastGeoJSONAt) < interval {
		return false
	}

	p.lastGeoJSONAt = now
	return true
}

func (p *Processor) CreateBroadcastMessage(featureCollection helpers.GeoJSONFeatureCollection) ([]byte, error) {
	atomic.AddInt64(&p.geoJSONSeq, 1)

	message := helpers.FlightsGeoJSONMessage{
		Type:              "flights_geojson",
		FeatureCollection: featureCollection,
		Seq:               p.geoJSONSeq,
		ServerTimestamp:   time.Now().UnixMilli(),
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling flights GeoJSON: %v", err)
		return nil, err
	}

	return data, nil
}
