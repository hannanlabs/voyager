package airport

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"os"

	"github.com/hannan/voyager/shared-go/flight"
)

type Repository struct {
	RawJSON   []byte
	ETag      string
	Positions map[string]flight.Position
	Codes     []string
	Loaded    bool
}

func New() *Repository {
	return &Repository{
		Positions: make(map[string]flight.Position),
	}
}

func (r *Repository) Load(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var geoJSON struct {
		Features []struct {
			Geometry struct {
				Coordinates []float64 `json:"coordinates"`
			} `json:"geometry"`
			Properties map[string]interface{} `json:"properties"`
		} `json:"features"`
	}

	if err := json.Unmarshal(data, &geoJSON); err != nil {
		return err
	}

	r.Positions = make(map[string]flight.Position)
	r.Codes = make([]string, 0, len(geoJSON.Features))

	for _, feature := range geoJSON.Features {
		if iata, ok := feature.Properties["iata"].(string); ok && iata != "" {
			if coords := feature.Geometry.Coordinates; len(coords) >= 2 {
				r.Positions[iata] = flight.Position{
					Longitude: coords[0],
					Latitude:  coords[1],
					Altitude:  0,
				}
				r.Codes = append(r.Codes, iata)
			}
		}
	}

	r.RawJSON = data
	hash := sha256.Sum256(data)
	r.ETag = hex.EncodeToString(hash[:])
	r.Loaded = true

	return nil
}

func (r *Repository) GetPositions() map[string]flight.Position {
	return r.Positions
}

func (r *Repository) GetCodes() []string {
	return r.Codes
}
