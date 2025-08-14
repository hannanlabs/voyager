package httpserver

import (
	"net/http"
	"sync"
)

var (
	isReady bool
	readyMu sync.RWMutex
)

func HealthzHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func SetReady(ready bool) {
	readyMu.Lock()
	defer readyMu.Unlock()
	isReady = ready
}

func IsReady() bool {
	readyMu.RLock()
	defer readyMu.RUnlock()
	return isReady
}

func ReadyzHandler(w http.ResponseWriter, r *http.Request) {
	if IsReady() {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Ready"))
	} else {
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte("Not Ready"))
	}
}