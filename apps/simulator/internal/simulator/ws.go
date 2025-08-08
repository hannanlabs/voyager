package simulator

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
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

	flights := make([]FlightState, 0, len(fs.flights))
	for _, flight := range fs.flights {
		flights = append(flights, *flight)
	}

	initialMsg := InitialStateMsg{
		Type:    "initial_state",
		Flights: flights,
	}

	if data, err := json.Marshal(initialMsg); err == nil {
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

func (fs *FlightSimulator) BroadcastFlights() {
	fs.clientsMu.RLock()
	defer fs.clientsMu.RUnlock()

	if len(fs.clients) == 0 {
		return
	}

	flights := make([]FlightState, 0, len(fs.flights))
	for _, flight := range fs.flights {
		flights = append(flights, *flight)
	}

	message := FlightUpdatesMsg{
		Type:    "flight_updates",
		Flights: flights,
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling flight updates: %v", err)
		return
	}

	for client := range fs.clients {
		select {
		case <-time.After(100 * time.Millisecond):
			fs.removeClient(client)
		default:
			if err := client.WriteMessage(websocket.TextMessage, data); err != nil {
				log.Printf("Error sending message to client: %v", err)
				fs.removeClient(client)
			}
		}
	}
}