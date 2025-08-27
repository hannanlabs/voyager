package wshandlers

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/hannan/voyager/simulator/internal/simulator"
)

func WSFlightsHandler(fs *simulator.FlightSimulator) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := (&websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				return origin == "http://localhost:3000"
			},
		}).Upgrade(w, r, nil)
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
