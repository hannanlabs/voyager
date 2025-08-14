package modularity

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
