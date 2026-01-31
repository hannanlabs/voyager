package geo

type Geometry struct {
	Type        string      `json:"type"`
	Coordinates interface{} `json:"coordinates"`
}

type Feature struct {
	Type       string                 `json:"type"`
	Geometry   Geometry               `json:"geometry"`
	Properties map[string]interface{} `json:"properties"`
}

type FeatureCollection struct {
	Type     string    `json:"type"`
	Features []Feature `json:"features"`
}

func NewFeatureCollection(features []Feature) FeatureCollection {
	return FeatureCollection{Type: "FeatureCollection", Features: features}
}

func NewPointFeature(lon, lat, alt float64, props map[string]interface{}) Feature {
	return Feature{
		Type:       "Feature",
		Geometry:   Geometry{Type: "Point", Coordinates: []float64{lon, lat, alt}},
		Properties: props,
	}
}

func NewLineStringFeature(coords [][]float64, props map[string]interface{}) Feature {
	return Feature{
		Type:       "Feature",
		Geometry:   Geometry{Type: "LineString", Coordinates: coords},
		Properties: props,
	}
}
