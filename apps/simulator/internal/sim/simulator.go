package sim

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
	"github.com/hannan/voyager/simulator/internal/helpers"
)

// ============================================================================
// Simulator - Main orchestration
// ============================================================================

type Simulator struct {
	updateHz         int
	geoJSONFlightsHz int
	flights          *FlightStore
	clients          *ClientStore
	geojson          *GeoJSONBuilder
	airports         *AirportStore
}

func New(updateHz, geoJSONFlightsHz int, airports *AirportStore) *Simulator {
	flights := newFlightStore()
	s := &Simulator{
		updateHz:         updateHz,
		geoJSONFlightsHz: geoJSONFlightsHz,
		flights:          flights,
		clients:          newClientStore(),
		geojson:          newGeoJSONBuilder(),
		airports:         airports,
	}
	s.generateFlights(50)
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
			s.updateFlights()
			s.broadcastFlights()
		}
	}
}

func (s *Simulator) updateFlights() {
	s.flights.update(s.updateHz, s.airports)
}

func (s *Simulator) broadcastFlights() {
	if s.clients.count() == 0 {
		return
	}
	if !s.geojson.shouldBroadcast(s.geoJSONFlightsHz) {
		return
	}

	flights := s.flights.getAll()
	fc := s.geojson.build(flights)
	data, err := s.geojson.marshal(fc)
	if err != nil {
		log.Printf("Error creating broadcast: %v", err)
		return
	}
	s.clients.broadcast(data)
}

func (s *Simulator) generateFlights(count int) {
	s.flights.generateBurst(count, s.airports)
}

func (s *Simulator) AddClient(conn *websocket.Conn) {
	s.clients.add(conn)
	flights := s.flights.getAll()
	fc := s.geojson.build(flights)
	go s.clients.sendInitial(conn, fc)
}

func (s *Simulator) RemoveClient(conn *websocket.Conn) {
	s.clients.remove(conn)
}

func (s *Simulator) GetFlight(id string) (*flight.State, bool) {
	return s.flights.get(id)
}

func (s *Simulator) FlightCount() int {
	return s.flights.count()
}

// ============================================================================
// FlightStore - Flight state management and physics
// ============================================================================

type FlightStore struct {
	mu            sync.RWMutex
	flights       map[string]*flight.State
	landedFlights map[string]time.Time
	lastTickAt    time.Time
	lastSpawnAt   time.Time
}

func newFlightStore() *FlightStore {
	now := time.Now()
	return &FlightStore{
		flights:       make(map[string]*flight.State),
		landedFlights: make(map[string]time.Time),
		lastTickAt:    now,
		lastSpawnAt:   now,
	}
}

func (s *FlightStore) get(id string) (*flight.State, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	f, ok := s.flights[id]
	return f, ok
}

func (s *FlightStore) getAll() map[string]*flight.State {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make(map[string]*flight.State, len(s.flights))
	for id, f := range s.flights {
		result[id] = f
	}
	return result
}

func (s *FlightStore) add(f *flight.State) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.flights[f.ID] = f
}

func (s *FlightStore) count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.flights)
}

func (s *FlightStore) update(updateHz int, airports *AirportStore) {
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
	positions := airports.GetPositions()

	for id, f := range s.flights {
		fromPos := positions[f.DepartureAirport]
		toPos := positions[f.ArrivalAirport]

		if f.Phase == flight.Landed {
			if landedAt, exists := s.landedFlights[id]; exists {
				if now.Sub(landedAt) > 10*time.Second {
					toRemove = append(toRemove, id)
					continue
				}
			} else {
				s.landedFlights[id] = now
			}
			f.LastComputedAt = now.Format(time.RFC3339)
			f.TraceID = generateTraceID()
			continue
		}

		f.Position = helpers.GreatCircleStep(f.Position, toPos, f.Speed, dt)
		f.Bearing = helpers.CalculateBearing(f.Position, toPos)
		f.Velocity = helpers.SpeedToVelocity(f.Speed, f.Bearing)
		f.Altitude = f.Position.Altitude
		f.DistanceRemaining = helpers.CalculateDistance(f.Position, toPos)

		totalDistance := helpers.CalculateDistance(fromPos, toPos)
		if totalDistance > 0.1 {
			f.Progress = 1.0 - (f.DistanceRemaining / totalDistance)
			f.Progress = math.Max(0, math.Min(1, f.Progress))
		}

		if f.DistanceRemaining < 50 {
			f.Speed = data.SpeedLanding
		}

		if f.Speed > 50 {
			hoursRemaining := f.DistanceRemaining / f.Speed
			f.EstimatedArrival = now.Add(time.Duration(hoursRemaining * float64(time.Hour))).Format(time.RFC3339)
		}

		newPhase := calculatePhase(f)
		if newPhase != f.Phase {
			f.Phase = newPhase
			f.Speed = speedForPhase(f.Phase)
		}

		if (f.DistanceRemaining < 15.0 && f.Altitude < 500 && f.Speed < 15000) || f.Progress >= 1.0 {
			f.Phase = flight.Landed
			f.DistanceRemaining = 0
			f.Progress = 1.0
		}

		f.LastComputedAt = now.Format(time.RFC3339)
		f.TraceID = generateTraceID()
	}

	for _, id := range toRemove {
		delete(s.flights, id)
		delete(s.landedFlights, id)
	}
}

func (s *FlightStore) dynamicSpawn(now time.Time, airports *AirportStore) {
	count := s.count()
	const target, fluctuation, max = 2000, 200, 2200

	if count >= max {
		return
	}

	var interval time.Duration
	var burst int

	if count < target {
		progress := float64(count) / float64(target)
		interval = time.Duration(5+15*progress) * time.Second
		burst = int(30 - 25*progress + mathrand.Float64()*10)
	} else {
		interval = 30 * time.Second
		burst = int(5 + mathrand.Float64()*10)
	}

	if now.Sub(s.lastSpawnAt) >= interval {
		s.generateBurst(burst, airports)
		s.lastSpawnAt = now
	}
}

func (s *FlightStore) generateBurst(count int, airports *AirportStore) {
	codes := airports.GetCodes()
	if len(codes) <= 1 {
		return
	}

	positions := airports.GetPositions()

	for i := 0; i < count; i++ {
		dep := codes[mathrand.Intn(len(codes))]
		arr := codes[mathrand.Intn(len(codes))]
		for arr == dep {
			arr = codes[mathrand.Intn(len(codes))]
		}

		airline := data.Airlines[mathrand.Intn(len(data.Airlines))]
		callSign := fmt.Sprintf("%s%d", airline.ICAOCode, i+1)

		f := createFlight(dep, arr, airline.Name, callSign, positions)
		if f != nil {
			s.add(f)
		}
	}
}

func createFlight(dep, arr, airline, callSign string, positions map[string]flight.Position) *flight.State {
	if dep == arr {
		return nil
	}

	fromPos := positions[dep]
	toPos := positions[arr]

	altitude := 2000 + mathrand.Float64()*8000
	fromPos.Altitude = altitude

	bearing := helpers.CalculateBearing(fromPos, toPos)
	vel := helpers.SpeedToVelocity(data.SpeedTakeoff, bearing)
	dist := helpers.CalculateDistance(fromPos, toPos)

	now := time.Now()
	return &flight.State{
		ID:                 fmt.Sprintf("%s-%s-%s", callSign, dep, arr),
		CallSign:           callSign,
		Airline:            airline,
		DepartureAirport:   dep,
		ArrivalAirport:     arr,
		Phase:              flight.Takeoff,
		Position:           fromPos,
		Velocity:           vel,
		Bearing:            bearing,
		Speed:              data.SpeedTakeoff,
		Altitude:           altitude,
		Progress:           0.0,
		DistanceRemaining:  dist,
		ScheduledDeparture: now.Format(time.RFC3339),
		ScheduledArrival:   now.Add(6 * time.Hour).Format(time.RFC3339),
		EstimatedArrival:   now.Add(6*time.Hour + time.Duration((mathrand.Float64()-0.5)*30)*time.Minute).Format(time.RFC3339),
		LastComputedAt:     now.Format(time.RFC3339),
		TraceID:            generateTraceID(),
	}
}

func calculatePhase(f *flight.State) flight.Phase {
	switch {
	case f.Phase == flight.Landed:
		return flight.Landed
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
// ClientStore - WebSocket client management
// ============================================================================

type ClientStore struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]bool
}

func newClientStore() *ClientStore {
	return &ClientStore{
		clients: make(map[*websocket.Conn]bool),
	}
}

func (s *ClientStore) add(conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.clients[conn] = true
}

func (s *ClientStore) remove(conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.clients[conn]; exists {
		delete(s.clients, conn)
		conn.Close()
	}
}

func (s *ClientStore) count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.clients)
}

func (s *ClientStore) getAll() []*websocket.Conn {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]*websocket.Conn, 0, len(s.clients))
	for c := range s.clients {
		result = append(result, c)
	}
	return result
}

func (s *ClientStore) sendInitial(conn *websocket.Conn, fc helpers.GeoJSONFeatureCollection) {
	msg := helpers.FlightsGeoJSONMessage{
		Type:              "flights_geojson",
		FeatureCollection: fc,
		Seq:               0,
		ServerTimestamp:   time.Now().UnixMilli(),
	}
	if data, err := json.Marshal(msg); err == nil {
		conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
		conn.WriteMessage(websocket.TextMessage, data)
	}
}

func (s *ClientStore) broadcast(data []byte) {
	clients := s.getAll()
	for _, c := range clients {
		c.SetWriteDeadline(time.Now().Add(5 * time.Second))
		if err := c.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("Error broadcasting to client: %v", err)
			s.remove(c)
		}
	}
}

// ============================================================================
// GeoJSONBuilder - GeoJSON feature collection building
// ============================================================================

type GeoJSONBuilder struct {
	lastBroadcast time.Time
	seq           int64
}

func newGeoJSONBuilder() *GeoJSONBuilder {
	return &GeoJSONBuilder{
		lastBroadcast: time.Now(),
	}
}

func (b *GeoJSONBuilder) shouldBroadcast(hz int) bool {
	now := time.Now()
	interval := time.Second / time.Duration(hz)
	if now.Sub(b.lastBroadcast) < interval {
		return false
	}
	b.lastBroadcast = now
	return true
}

func (b *GeoJSONBuilder) build(flights map[string]*flight.State) helpers.GeoJSONFeatureCollection {
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

func (b *GeoJSONBuilder) marshal(fc helpers.GeoJSONFeatureCollection) ([]byte, error) {
	atomic.AddInt64(&b.seq, 1)
	msg := helpers.FlightsGeoJSONMessage{
		Type:              "flights_geojson",
		FeatureCollection: fc,
		Seq:               b.seq,
		ServerTimestamp:   time.Now().UnixMilli(),
	}
	return json.Marshal(msg)
}

// ============================================================================
// AirportStore - Airport data loading and storage
// ============================================================================

type AirportStore struct {
	RawJSON   []byte
	ETag      string
	Positions map[string]flight.Position
	Codes     []string
	Loaded    bool
}

func NewAirportStore() *AirportStore {
	return &AirportStore{
		Positions: make(map[string]flight.Position),
	}
}

func (s *AirportStore) Load(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var geoJSON struct {
		Features []struct {
			Geometry struct {
				Coordinates []float64 `json:"coordinates"`
			} `json:"geometry"`
			Properties map[string]interface{} `json:"properties"`
		} `json:"features"`
	}

	if err := json.Unmarshal(data, &geoJSON); err != nil {
		return err
	}

	s.Positions = make(map[string]flight.Position)
	s.Codes = make([]string, 0, len(geoJSON.Features))

	for _, f := range geoJSON.Features {
		if iata, ok := f.Properties["iata"].(string); ok && iata != "" {
			if coords := f.Geometry.Coordinates; len(coords) >= 2 {
				s.Positions[iata] = flight.Position{
					Longitude: coords[0],
					Latitude:  coords[1],
				}
				s.Codes = append(s.Codes, iata)
			}
		}
	}

	s.RawJSON = data
	hash := sha256.Sum256(data)
	s.ETag = hex.EncodeToString(hash[:])
	s.Loaded = true

	return nil
}

func (s *AirportStore) GetPositions() map[string]flight.Position {
	return s.Positions
}

func (s *AirportStore) GetCodes() []string {
	return s.Codes
}

// ============================================================================
// Helpers (inlined from helpers/timing.go)
// ============================================================================

func generateTraceID() string {
	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		now := time.Now().UnixNano()
		return fmt.Sprintf("%016x%016x", now, mathrand.Int63())
	}
	return hex.EncodeToString(bytes)
}
