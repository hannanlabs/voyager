package simulator

var Airports = map[string]FlightPosition{
	"JFK": {40.6413, -73.7781, 0},
	"LAX": {33.9425, -118.4081, 0},
	"ATL": {33.6407, -84.4277, 0},
	"SEA": {47.4502, -122.3088, 0},
	"DEN": {39.8561, -104.6737, 0},
	"ORD": {41.9742, -87.9073, 0},
}

var Airlines = []string{"United", "American", "Delta", "Southwest", "JetBlue", "Alaska"}

var Phases = []string{"takeoff", "climb", "cruise", "descent", "landing"}