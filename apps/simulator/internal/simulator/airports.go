package simulator

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"os"
	"sync"

	"github.com/hannan/voyager/shared-go/flight"
	"github.com/hannan/voyager/shared-go/modularity"
)

type AirportData struct {
	mu        sync.RWMutex
	rawJSON   []byte
	etag      string
	positions map[string]flight.Position
	codes     []string
	loaded    bool
}

func (ad *AirportData) Load(path string) error {
	ad.mu.Lock()
	defer ad.mu.Unlock()

	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var fc modularity.GeoJSONFeatureCollection
	if err := json.Unmarshal(data, &fc); err != nil {
		return err
	}

	positions := make(map[string]flight.Position, len(fc.Features))
	var codes []string

	for _, feature := range fc.Features {
		iata, ok := feature.Properties["iata"].(string)
		if !ok || iata == "" {
			continue
		}

		coords, ok := feature.Geometry.Coordinates.([]interface{})
		if ok && len(coords) >= 2 {
			longitude, _ := coords[0].(float64)
			latitude, _ := coords[1].(float64)

			positions[iata] = flight.Position{
				Latitude:  latitude,
				Longitude: longitude,
				Altitude:  0,
			}
			codes = append(codes, iata)
		}
	}

	ad.rawJSON = data
	ad.etag = fmt.Sprintf("%x", md5.Sum(data))
	ad.positions = positions
	ad.codes = codes
	ad.loaded = true

	return nil
}

func (ad *AirportData) GetRawJSON() []byte {
	ad.mu.RLock()
	defer ad.mu.RUnlock()
	return ad.rawJSON
}

func (ad *AirportData) GetETag() string {
	ad.mu.RLock()
	defer ad.mu.RUnlock()
	return ad.etag
}

func (ad *AirportData) GetPositions() map[string]flight.Position {
	ad.mu.RLock()
	defer ad.mu.RUnlock()
	return ad.positions
}

func (ad *AirportData) GetCodes() []string {
	ad.mu.RLock()
	defer ad.mu.RUnlock()
	return ad.codes
}

func (ad *AirportData) IsLoaded() bool {
	ad.mu.RLock()
	defer ad.mu.RUnlock()
	return ad.loaded
}

var globalAirportData = &AirportData{}

func GetGlobalAirportData() *AirportData {
	return globalAirportData
}

func InitializeGlobalAirportData(path string) error {
	return globalAirportData.Load(path)
}
