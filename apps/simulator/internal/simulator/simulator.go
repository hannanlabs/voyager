package simulator

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math"
	mathrand "math/rand"
	"os"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/shared-go/data"
	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/shared-go/geojson"
	"github.com/hannan/voyager/shared-go/geomath"
)

// ============================================================================
// Simulator
// ============================================================================

type Simulator struct {
	updateHz         int
	geoJSONFlightsHz int
	flights          *flightStore
	clients          *clientStore
	airports         *AirportStore
	lastBroadcast    time.Time
	seq              int64
}

func New(updateHz, geoJSONFlightsHz int, airports *AirportStore) *Simulator {
	s := &Simulator{
		updateHz:         updateHz,
		geoJSONFlightsHz: geoJSONFlightsHz,
		flights:          newFlightStore(),
		clients:          newClientStore(),
		airports:         airports,
		lastBroadcast:    time.Now(),
	}
	s.flights.generateBurst(50, s.airports)
	return s
}

func (s *Simulator) Start(ctx context.Context) {
	ticker := time.NewTicker(time.Duration(1000/s.updateHz) * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.flights.update(s.updateHz, s.airports)
			s.broadcast()
		}
	}
}

func (s *Simulator) broadcast() {
	if s.clients.count() == 0 {
		return
	}
	now := time.Now()
	if now.Sub(s.lastBroadcast) < time.Second/time.Duration(s.geoJSONFlightsHz) {
		return
	}
	s.lastBroadcast = now

	atomic.AddInt64(&s.seq, 1)
	msg := flightsGeoJSONMessage{
		Type:              "flights_geojson",
		FeatureCollection: s.buildFlightsGeoJSON(),
		Seq:               s.seq,
		ServerTimestamp:   now.UnixMilli(),
	}
	if data, err := json.Marshal(msg); err == nil {
		s.clients.broadcast(data)
	}
}

func (s *Simulator) FlightCount() int {
	return s.flights.count()
}

func (s *Simulator) buildFlightsGeoJSON() geojson.FeatureCollection {
	flights := s.flights.getAll()
	features := make([]geojson.Feature, 0, len(flights))
	for _, f := range flights {
		features = append(features, geojson.NewPointFeature(f.Position.Longitude, f.Position.Latitude, f.Position.Altitude, map[string]interface{}{
			"id": f.ID, "callSign": f.CallSign, "airline": f.Airline,
			"departureAirport": f.DepartureAirport, "arrivalAirport": f.ArrivalAirport,
			"phase": string(f.Phase), "bearing": f.Bearing, "speed": f.Speed,
			"altitude": f.Position.Altitude, "progress": f.Progress, "distanceRemaining": f.DistanceRemaining,
			"scheduledDeparture": f.ScheduledDeparture, "scheduledArrival": f.ScheduledArrival,
			"estimatedArrival": f.EstimatedArrival, "lastComputedAt": f.LastComputedAt, "traceID": f.TraceID,
		}))
	}
	return geojson.NewFeatureCollection(features)
}

// ============================================================================
// FlightStore
// ============================================================================

type flightStore struct {
	mu          sync.RWMutex
	flights     map[string]*flight.State
	lastTickAt  time.Time
	lastSpawnAt time.Time
}

func newFlightStore() *flightStore {
	now := time.Now()
	return &flightStore{
		flights:     make(map[string]*flight.State),
		lastTickAt:  now,
		lastSpawnAt: now,
	}
}

func (s *flightStore) get(id string) (*flight.State, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	f, ok := s.flights[id]
	return f, ok
}

func (s *flightStore) getAll() map[string]*flight.State {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make(map[string]*flight.State, len(s.flights))
	for id, f := range s.flights {
		result[id] = f
	}
	return result
}

func (s *flightStore) add(f *flight.State) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.flights[f.ID] = f
}

func (s *flightStore) count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.flights)
}

func (s *flightStore) update(updateHz int, airports *AirportStore) {
	now := time.Now()
	dt := now.Sub(s.lastTickAt).Seconds()
	s.lastTickAt = now
	if dt > 5.0 {
		dt = 1.0 / float64(updateHz)
	}
	if dt < 0.001 {
		dt = 0.001
	}

	s.dynamicSpawn(now, airports)

	s.mu.Lock()
	defer s.mu.Unlock()

	var toRemove []string
	positions := airports.Positions

	for id, f := range s.flights {
		// Remove landed flights immediately
		if f.Phase == flight.Landed {
			toRemove = append(toRemove, id)
			continue
		}

		fromPos, toPos := positions[f.DepartureAirport], positions[f.ArrivalAirport]

		f.Position = geomath.GreatCircleStep(f.Position, toPos, f.Speed, dt)
		f.Bearing = geomath.CalculateBearing(f.Position, toPos)
		f.Velocity = geomath.SpeedToVelocity(f.Speed, f.Bearing)
		f.Altitude = f.Position.Altitude
		f.DistanceRemaining = geomath.CalculateDistance(f.Position, toPos)

		if totalDist := geomath.CalculateDistance(fromPos, toPos); totalDist > 0.1 {
			f.Progress = math.Max(0, math.Min(1, 1.0-(f.DistanceRemaining/totalDist)))
		}
		if f.DistanceRemaining < 50 {
			f.Speed = data.SpeedLanding
		}
		if f.Speed > 50 {
			f.EstimatedArrival = now.Add(time.Duration(f.DistanceRemaining / f.Speed * float64(time.Hour))).Format(time.RFC3339)
		}

		if newPhase := calculatePhase(f); newPhase != f.Phase {
			f.Phase = newPhase
			f.Speed = speedForPhase(f.Phase)
		}
		if (f.DistanceRemaining < 15.0 && f.Altitude < 500 && f.Speed < 15000) || f.Progress >= 1.0 {
			f.Phase, f.DistanceRemaining, f.Progress = flight.Landed, 0, 1.0
		}

		f.LastComputedAt = now.Format(time.RFC3339)
		f.TraceID = generateTraceID()
	}

	for _, id := range toRemove {
		delete(s.flights, id)
	}
}

func (s *flightStore) dynamicSpawn(now time.Time, airports *AirportStore) {
	count := s.count()
	if count >= 2200 {
		return
	}
	var interval time.Duration
	var burst int
	if count < 2000 {
		progress := float64(count) / 2000
		interval = time.Duration(5+15*progress) * time.Second
		burst = int(30 - 25*progress + mathrand.Float64()*10)
	} else {
		interval, burst = 30*time.Second, int(5+mathrand.Float64()*10)
	}
	if now.Sub(s.lastSpawnAt) >= interval {
		s.generateBurst(burst, airports)
		s.lastSpawnAt = now
	}
}

func (s *flightStore) generateBurst(count int, airports *AirportStore) {
	codes := airports.Codes
	if len(codes) <= 1 {
		return
	}
	for i := 0; i < count; i++ {
		dep, arr := codes[mathrand.Intn(len(codes))], codes[mathrand.Intn(len(codes))]
		for arr == dep {
			arr = codes[mathrand.Intn(len(codes))]
		}
		airline := data.Airlines[mathrand.Intn(len(data.Airlines))]
		if f := createFlight(dep, arr, airline.Name, fmt.Sprintf("%s%d", airline.ICAOCode, i+1), airports.Positions); f != nil {
			s.add(f)
		}
	}
}

func createFlight(dep, arr, airline, callSign string, positions map[string]flight.Position) *flight.State {
	if dep == arr {
		return nil
	}
	fromPos, toPos := positions[dep], positions[arr]
	fromPos.Altitude = 2000 + mathrand.Float64()*8000
	bearing := geomath.CalculateBearing(fromPos, toPos)
	now := time.Now()
	return &flight.State{
		ID: fmt.Sprintf("%s-%s-%s", callSign, dep, arr), CallSign: callSign, Airline: airline,
		DepartureAirport: dep, ArrivalAirport: arr, Phase: flight.Takeoff,
		Position: fromPos, Velocity: geomath.SpeedToVelocity(data.SpeedTakeoff, bearing),
		Bearing: bearing, Speed: data.SpeedTakeoff, Altitude: fromPos.Altitude,
		Progress: 0, DistanceRemaining: geomath.CalculateDistance(fromPos, toPos),
		ScheduledDeparture: now.Format(time.RFC3339),
		ScheduledArrival:   now.Add(6 * time.Hour).Format(time.RFC3339),
		EstimatedArrival:   now.Add(6*time.Hour + time.Duration((mathrand.Float64()-0.5)*30)*time.Minute).Format(time.RFC3339),
		LastComputedAt:     now.Format(time.RFC3339),
		TraceID:            generateTraceID(),
	}
}

func calculatePhase(f *flight.State) flight.Phase {
	switch {
	case f.Progress < 0.15 && f.Altitude < 15000 && f.Speed < 15000:
		return flight.Takeoff
	case f.Progress < 0.25 && f.Altitude < 40000:
		return flight.Climb
	case (f.DistanceRemaining < 50 || f.Progress > 0.90) && f.Altitude < 8000 && f.Speed < 21000:
		return flight.Landing
	case f.Progress > 0.75 && (f.Altitude < 45000 || f.DistanceRemaining < 200):
		return flight.Descent
	default:
		return flight.Cruise
	}
}

func speedForPhase(phase flight.Phase) float64 {
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
	default:
		return 0
	}
}

// ============================================================================
// ClientStore
// ============================================================================

type clientStore struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]bool
}

func newClientStore() *clientStore {
	return &clientStore{clients: make(map[*websocket.Conn]bool)}
}

func (s *clientStore) add(conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.clients[conn] = true
}

func (s *clientStore) remove(conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.clients[conn]; exists {
		delete(s.clients, conn)
		conn.Close()
	}
}

func (s *clientStore) count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.clients)
}

func (s *clientStore) sendInitial(conn *websocket.Conn, fc geojson.FeatureCollection) {
	msg := flightsGeoJSONMessage{Type: "flights_geojson", FeatureCollection: fc, Seq: 0, ServerTimestamp: time.Now().UnixMilli()}
	if data, err := json.Marshal(msg); err == nil {
		conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
		conn.WriteMessage(websocket.TextMessage, data)
	}
}

func (s *clientStore) broadcast(data []byte) {
	s.mu.RLock()
	clients := make([]*websocket.Conn, 0, len(s.clients))
	for c := range s.clients {
		clients = append(clients, c)
	}
	s.mu.RUnlock()

	for _, c := range clients {
		c.SetWriteDeadline(time.Now().Add(5 * time.Second))
		if err := c.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("Error broadcasting: %v", err)
			s.remove(c)
		}
	}
}

// ============================================================================
// AirportStore
// ============================================================================

type AirportStore struct {
	RawJSON   []byte
	ETag      string
	Positions map[string]flight.Position
	Codes     []string
	Loaded    bool
}

func NewAirportStore() *AirportStore {
	return &AirportStore{Positions: make(map[string]flight.Position)}
}

func (s *AirportStore) Load(path string) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var geoJSONData struct {
		Features []struct {
			Geometry struct {
				Coordinates []float64 `json:"coordinates"`
			} `json:"geometry"`
			Properties map[string]interface{} `json:"properties"`
		} `json:"features"`
	}
	if err := json.Unmarshal(raw, &geoJSONData); err != nil {
		return err
	}
	s.Positions = make(map[string]flight.Position)
	s.Codes = make([]string, 0, len(geoJSONData.Features))
	for _, f := range geoJSONData.Features {
		if iata, ok := f.Properties["iata"].(string); ok && iata != "" && len(f.Geometry.Coordinates) >= 2 {
			s.Positions[iata] = flight.Position{Longitude: f.Geometry.Coordinates[0], Latitude: f.Geometry.Coordinates[1]}
			s.Codes = append(s.Codes, iata)
		}
	}
	s.RawJSON = raw
	hash := sha256.Sum256(raw)
	s.ETag = hex.EncodeToString(hash[:])
	s.Loaded = true
	return nil
}

// ============================================================================
// Types and helpers
// ============================================================================

type flightsGeoJSONMessage struct {
	Type              string                    `json:"type"`
	FeatureCollection geojson.FeatureCollection `json:"featureCollection"`
	Seq               int64                     `json:"seq"`
	ServerTimestamp   int64                     `json:"serverTimestamp"`
}

func generateTraceID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%016x%016x", time.Now().UnixNano(), mathrand.Int63())
	}
	return hex.EncodeToString(bytes)
}
