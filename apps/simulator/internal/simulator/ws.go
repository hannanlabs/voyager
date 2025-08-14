package simulator

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/shared-go/modularity"
	"github.com/hannan/voyager/simulator/internal/httpserver"
)

var upgrader = websocket.Upgrader{
	EnableCompression: true,
	CheckOrigin: func(r *http.Request) bool {
		allowedOrigins := httpserver.GetAllowedOrigins()
		if len(allowedOrigins) == 0 {
			return true
		}

		origin := r.Header.Get("Origin")
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				return true
			}
		}
		return false
	},
}

func (fs *FlightSimulator) WSFlightsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	fs.addClient(conn)
	log.Printf("New WebSocket client connected")

	defer func() {
		fs.removeClient(conn)
		log.Printf("WebSocket client disconnected")
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
	}
}

func (fs *FlightSimulator) addClient(conn *websocket.Conn) {
	fs.clientsMu.Lock()
	defer fs.clientsMu.Unlock()

	fs.clients[conn] = true

	go fs.sendInitialGeoJSONToClient(conn)
}

func (fs *FlightSimulator) buildFlightsGeoJSON() modularity.GeoJSONFeatureCollection {
	fs.flightsMu.RLock()
	defer fs.flightsMu.RUnlock()

	features := make([]modularity.GeoJSONFeature, 0, len(fs.flights))
	for _, f := range fs.flights {
		feature := NewPointFeature(
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

	return NewFeatureCollection(features)
}

func (fs *FlightSimulator) sendInitialGeoJSONToClient(conn *websocket.Conn) {
	featureCollection := fs.buildFlightsGeoJSON()

	message := modularity.FlightsGeoJSONMessage{
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

func (fs *FlightSimulator) removeClient(conn *websocket.Conn) {
	fs.clientsMu.Lock()
	defer fs.clientsMu.Unlock()

	if _, exists := fs.clients[conn]; exists {
		delete(fs.clients, conn)
		conn.Close()
	}
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
	message := modularity.FlightsGeoJSONMessage{
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
			fs.removeClient(client)
		}
	}
}
