package simulator

import (
	"net/http"
)

func (fs *FlightSimulator) SetReady(ready bool) {
	fs.readyMu.Lock()
	defer fs.readyMu.Unlock()
	fs.isReady = ready
}

func (fs *FlightSimulator) IsReady() bool {
	fs.readyMu.RLock()
	defer fs.readyMu.RUnlock()
	return fs.isReady
}

func (fs *FlightSimulator) ReadyzHandler(w http.ResponseWriter, r *http.Request) {
	if fs.IsReady() {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Ready"))
	} else {
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte("Not Ready"))
	}
}