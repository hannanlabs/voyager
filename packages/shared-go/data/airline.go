package data

const (
	SpeedTakeoff = 10000.0
	SpeedClimb   = 18000.0
	SpeedCruise  = 30000.0
	SpeedDescent = 21000.0
	SpeedLanding = 15000.0

	ServerPort       = "8080"
	UpdateHz         = 6
	AirportPath      = "data/airports.iata.geojson"
	GeoJSONFlightsHz = 2
)

type Airline struct {
	Name     string
	ICAOCode string
}

var Airlines = []Airline{
	{"United", "UAL"},
	{"American", "AAL"},
	{"Delta", "DL"},
	{"Southwest", "SWA"},
	{"JetBlue", "JBU"},
	{"Alaska", "ASA"},
}
