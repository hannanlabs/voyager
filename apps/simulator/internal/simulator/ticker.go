package simulator

import (
	"context"
	"time"
)

func (fs *FlightSimulator) StartTicker(ctx context.Context) {
	ticker := time.NewTicker(time.Duration(1000/fs.updateHz) * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			fs.UpdateFlights()
			fs.BroadcastFlightsGeoJSON()
		}
	}
}