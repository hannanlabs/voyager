package simulator

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/simulator/internal/airports"
	"github.com/hannan/voyager/simulator/internal/helpers"
)

type FlightSimulator struct {
	flights          map[string]*flight.State
	flightsMu        sync.RWMutex
	clients          map[*websocket.Conn]bool
	clientsMu        sync.RWMutex
	updateHz         int
	geoJSONFlightsHz int
	lastTickAt       time.Time
	lastGeoJSONAt    time.Time
	landedFlights    map[string]time.Time
	lastSpawnAt      time.Time
	geoJSONSeq       int64
	airports         airports.Repository
}

func NewFlightSimulator(updateHz int, geoJSONFlightsHz int, airports airports.Repository) *FlightSimulator {
	now := time.Now()
	sim := &FlightSimulator{
		flights:          make(map[string]*flight.State),
		clients:          make(map[*websocket.Conn]bool),
		updateHz:         updateHz,
		geoJSONFlightsHz: geoJSONFlightsHz,
		lastTickAt:       now,
		airports:         airports,
		lastGeoJSONAt:    now,
		landedFlights:    make(map[string]time.Time),
		lastSpawnAt:      now,
		geoJSONSeq:       0,
	}

	sim.generateAirportBurst(50)

	return sim
}

func (fs *FlightSimulator) Start(ctx context.Context) {
	helpers.StartTicker(ctx, fs.updateHz, func() {
		fs.UpdateFlights()
		fs.BroadcastFlightsGeoJSON()
	})
}

func (fs *FlightSimulator) GetFlightByID(flightID string) (*flight.State, bool) {
	fs.flightsMu.RLock()
	defer fs.flightsMu.RUnlock()

	flightState, exists := fs.flights[flightID]
	return flightState, exists
}

func (fs *FlightSimulator) AddClient(conn *websocket.Conn) {
	fs.clientsMu.Lock()
	defer fs.clientsMu.Unlock()

	fs.clients[conn] = true
	go fs.sendInitialGeoJSONToClient(conn)
}

func (fs *FlightSimulator) RemoveClient(conn *websocket.Conn) {
	fs.clientsMu.Lock()
	defer fs.clientsMu.Unlock()

	if _, exists := fs.clients[conn]; exists {
		delete(fs.clients, conn)
		conn.Close()
	}
}

func (fs *FlightSimulator) sendInitialGeoJSONToClient(conn *websocket.Conn) {
	featureCollection := fs.buildFlightsGeoJSON()

	message := helpers.FlightsGeoJSONMessage{
		Type:              "flights_geojson",
		FeatureCollection: featureCollection,
		Seq:               0,
		ServerTimestamp:   time.Now().UnixMilli(),
	}

	if data, err := json.Marshal(message); err == nil {
		deadline := time.Now().Add(5 * time.Second)
		conn.SetWriteDeadline(deadline)
		conn.WriteMessage(websocket.TextMessage, data)
	}
}

func (fs *FlightSimulator) buildFlightsGeoJSON() helpers.GeoJSONFeatureCollection {
	fs.flightsMu.RLock()
	defer fs.flightsMu.RUnlock()

	features := make([]helpers.GeoJSONFeature, 0, len(fs.flights))
	for _, f := range fs.flights {
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

func (fs *FlightSimulator) BroadcastFlightsGeoJSON() {
	now := time.Now()
	interval := time.Duration(1000000000/fs.geoJSONFlightsHz) * time.Nanosecond

	if now.Sub(fs.lastGeoJSONAt) < interval {
		return
	}

	fs.lastGeoJSONAt = now

	fs.clientsMu.RLock()
	if len(fs.clients) == 0 {
		fs.clientsMu.RUnlock()
		return
	}

	clientsSlice := make([]*websocket.Conn, 0, len(fs.clients))
	for client := range fs.clients {
		clientsSlice = append(clientsSlice, client)
	}
	fs.clientsMu.RUnlock()

	featureCollection := fs.buildFlightsGeoJSON()

	fs.geoJSONSeq++
	message := helpers.FlightsGeoJSONMessage{
		Type:              "flights_geojson",
		FeatureCollection: featureCollection,
		Seq:               fs.geoJSONSeq,
		ServerTimestamp:   now.UnixMilli(),
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling flights GeoJSON: %v", err)
		return
	}

	for _, client := range clientsSlice {
		deadline := time.Now().Add(5 * time.Second)
		client.SetWriteDeadline(deadline)

		if err := client.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("Error sending GeoJSON message to client: %v", err)
			fs.RemoveClient(client)
		}
	}
}
