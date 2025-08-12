package simulator

import (
	"encoding/json"
	"os"

	"github.com/hannan/voyager/shared-go/flight"
)

type GeoJSONFeature struct {
	Type       string                 `json:"type"`
	Geometry   GeoJSONGeometry        `json:"geometry"`
	Properties map[string]interface{} `json:"properties"`
}

type GeoJSONGeometry struct {
	Type        string    `json:"type"`
	Coordinates []float64 `json:"coordinates"`
}

type GeoJSONFeatureCollection struct {
	Type     string           `json:"type"`
	Features []GeoJSONFeature `json:"features"`
}

func LoadAirports(path string) (map[string]flight.Position, []string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, nil, err
	}

	var geojson GeoJSONFeatureCollection
	if err := json.Unmarshal(data, &geojson); err != nil {
		return nil, nil, err
	}

	positions := make(map[string]flight.Position, len(geojson.Features))
	var codes []string

	for _, feature := range geojson.Features {
		iata, ok := feature.Properties["iata"].(string)
		if !ok || iata == "" {
			continue
		}

		if len(feature.Geometry.Coordinates) >= 2 {
			longitude := feature.Geometry.Coordinates[0]
			latitude := feature.Geometry.Coordinates[1]

			positions[iata] = flight.Position{
				Latitude:  latitude,
				Longitude: longitude,
				Altitude:  0,
			}
			codes = append(codes, iata)
		}
	}
	return positions, codes, nil
}

var Airports map[string]flight.Position
var AirportCodes []string

func init() {
	var err error
	Airports, AirportCodes, err = LoadAirports("data/airports.iata.geojson")
	if err != nil {
		panic("Failed to load airports data: " + err.Error())
	}
}

var Airlines = []string{"United", "American", "Delta", "Southwest", "JetBlue", "Alaska"}

var Phases = []flight.Phase{
	flight.Takeoff,
	flight.Climb,
	flight.Cruise,
	flight.Descent,
	flight.Landing,
}
