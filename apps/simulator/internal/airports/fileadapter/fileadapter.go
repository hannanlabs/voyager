package fileadapter

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"sync"

	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/simulator/internal/airports"
)

type FileAdapter struct {
	mu        sync.RWMutex
	path      string
	rawJSON   []byte
	etag      string
	positions map[string]flight.Position
	codes     []string
	loaded    bool
}

func New() airports.Repository {
	return &FileAdapter{
		positions: make(map[string]flight.Position),
		codes:     []string{},
	}
}

func (f *FileAdapter) Load(path string) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.path = path
	return f.loadInternal()
}

func (f *FileAdapter) Reload() error {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.path == "" {
		return fmt.Errorf("no path set, call Load() first")
	}

	return f.loadInternal()
}

func (f *FileAdapter) loadInternal() error {
	data, err := os.ReadFile(f.path)
	if err != nil {
		return fmt.Errorf("failed to read airports file: %w", err)
	}

	var geoJSON struct {
		Type     string `json:"type"`
		Features []struct {
			Type     string `json:"type"`
			Geometry struct {
				Type        string    `json:"type"`
				Coordinates []float64 `json:"coordinates"`
			} `json:"geometry"`
			Properties map[string]interface{} `json:"properties"`
		} `json:"features"`
	}

	if err := json.Unmarshal(data, &geoJSON); err != nil {
		return fmt.Errorf("failed to unmarshal airports GeoJSON: %w", err)
	}

	positions := make(map[string]flight.Position)
	codes := make([]string, 0, len(geoJSON.Features))

	for _, feature := range geoJSON.Features {
		if props := feature.Properties; props != nil {
			if iata, ok := props["iata"].(string); ok && iata != "" {
				if coords := feature.Geometry.Coordinates; len(coords) >= 2 {
					positions[iata] = flight.Position{
						Longitude: coords[0],
						Latitude:  coords[1],
						Altitude:  0,
					}
					codes = append(codes, iata)
				}
			}
		}
	}

	f.rawJSON = data
	f.etag = generateETag(data)
	f.positions = positions
	f.codes = codes
	f.loaded = true

	return nil
}

func (f *FileAdapter) RawJSON() []byte {
	f.mu.RLock()
	defer f.mu.RUnlock()

	if f.rawJSON == nil {
		return nil
	}
	result := make([]byte, len(f.rawJSON))
	copy(result, f.rawJSON)
	return result
}

func (f *FileAdapter) ETag() string {
	f.mu.RLock()
	defer f.mu.RUnlock()

	return f.etag
}

func (f *FileAdapter) Positions() map[string]flight.Position {
	f.mu.RLock()
	defer f.mu.RUnlock()

	result := make(map[string]flight.Position, len(f.positions))
	for k, v := range f.positions {
		result[k] = v
	}
	return result
}

func (f *FileAdapter) Codes() []string {
	f.mu.RLock()
	defer f.mu.RUnlock()

	result := make([]string, len(f.codes))
	copy(result, f.codes)
	return result
}

func (f *FileAdapter) IsLoaded() bool {
	f.mu.RLock()
	defer f.mu.RUnlock()

	return f.loaded
}

func generateETag(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}
