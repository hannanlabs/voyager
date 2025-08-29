package client

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/simulator/internal/helpers"
)

type Manager struct {
	clients   map[*websocket.Conn]bool
	clientsMu sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		clients: make(map[*websocket.Conn]bool),
	}
}

func (m *Manager) AddClient(conn *websocket.Conn) {
	m.clientsMu.Lock()
	defer m.clientsMu.Unlock()
	m.clients[conn] = true
}

func (m *Manager) RemoveClient(conn *websocket.Conn) {
	m.clientsMu.Lock()
	defer m.clientsMu.Unlock()

	if _, exists := m.clients[conn]; exists {
		delete(m.clients, conn)
		conn.Close()
	}
}

func (m *Manager) GetClients() []*websocket.Conn {
	m.clientsMu.RLock()
	defer m.clientsMu.RUnlock()

	clients := make([]*websocket.Conn, 0, len(m.clients))
	for client := range m.clients {
		clients = append(clients, client)
	}
	return clients
}

func (m *Manager) ClientCount() int {
	m.clientsMu.RLock()
	defer m.clientsMu.RUnlock()
	return len(m.clients)
}

func (m *Manager) SendInitialGeoJSONToClient(conn *websocket.Conn, featureCollection helpers.GeoJSONFeatureCollection) {
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

func (m *Manager) BroadcastToClients(data []byte) {
	clients := m.GetClients()

	for _, client := range clients {
		deadline := time.Now().Add(5 * time.Second)
		client.SetWriteDeadline(deadline)

		if err := client.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("Error sending message to client: %v", err)
			m.RemoveClient(client)
		}
	}
}
