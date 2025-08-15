package helpers

type GeoJSONGeometry struct {
	Type        string      `json:"type"`
	Coordinates interface{} `json:"coordinates"`
}

type GeoJSONFeature struct {
	Type       string                 `json:"type"`
	Geometry   GeoJSONGeometry        `json:"geometry"`
	Properties map[string]interface{} `json:"properties"`
}

type GeoJSONFeatureCollection struct {
	Type     string           `json:"type"`
	Features []GeoJSONFeature `json:"features"`
}

type FlightsGeoJSONMessage struct {
	Type              string                   `json:"type"`
	FeatureCollection GeoJSONFeatureCollection `json:"featureCollection"`
	Seq               int64                    `json:"seq"`
	ServerTimestamp   int64                    `json:"serverTimestamp"`
}

func NewFeatureCollection(features []GeoJSONFeature) GeoJSONFeatureCollection {
	return GeoJSONFeatureCollection{
		Type:     "FeatureCollection",
		Features: features,
	}
}

func NewPointFeature(longitude, latitude, altitude float64, properties map[string]interface{}) GeoJSONFeature {
	return GeoJSONFeature{
		Type: "Feature",
		Geometry: GeoJSONGeometry{
			Type:        "Point",
			Coordinates: []float64{longitude, latitude, altitude},
		},
		Properties: properties,
	}
}

func NewLineStringFeature(coordinates [][]float64, properties map[string]interface{}) GeoJSONFeature {
	return GeoJSONFeature{
		Type: "Feature",
		Geometry: GeoJSONGeometry{
			Type:        "LineString",
			Coordinates: coordinates,
		},
		Properties: properties,
	}
}
