package httpserver

import (
	"context"
	"log"
	"net/http"
	"time"
)

func NewServer(port string, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:    ":" + port,
		Handler: handler,
	}
}

func StartServer(server *http.Server) error {
	log.Printf("Starting server on %s", server.Addr)
	return server.ListenAndServe()
}

func ShutdownServer(server *http.Server, timeout time.Duration) error {
	log.Println("Shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return err
	}

	log.Println("Server stopped")
	return nil
}
