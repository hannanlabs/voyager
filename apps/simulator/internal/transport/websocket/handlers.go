package wshandlers

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/simulator/internal/simulator"
)

var upgrader = websocket.Upgrader{
	EnableCompression: false,
	CheckOrigin: func(r *http.Request) bool {
		allowedOriginsEnv := os.Getenv("ALLOWED_ORIGINS")
		if allowedOriginsEnv == "" {
			return true
		}

		allowedOrigins := strings.Split(allowedOriginsEnv, ",")
		origin := r.Header.Get("Origin")
		for _, allowed := range allowedOrigins {
			if strings.TrimSpace(allowed) == origin {
				return true
			}
		}
		return false
	},
}

func WSFlightsHandler(fs *simulator.FlightSimulator) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

		fs.AddClient(conn)
		log.Printf("New WebSocket client connected")

		defer func() {
			fs.RemoveClient(conn)
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
}
