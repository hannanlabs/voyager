package httpserver

import (
	"log"
	"net/http"
)

func StartServer(port string, handler http.Handler) error {
	log.Printf("Starting server on :%s", port)
	return http.ListenAndServe(":"+port, handler)
}
