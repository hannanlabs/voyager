package flight

type State struct {
	ID                 string   `json:"id"`
	CallSign           string   `json:"callSign"`
	Airline            string   `json:"airline"`
	DepartureAirport   string   `json:"departureAirport"`
	ArrivalAirport     string   `json:"arrivalAirport"`
	Phase              Phase    `json:"phase"`
	Position           Position `json:"position"`
	Velocity           Velocity `json:"velocity"`
	Bearing            float64  `json:"bearing"`
	Speed              float64  `json:"speed"`
	Altitude           float64  `json:"altitude"`
	Progress           float64  `json:"progress"`
	DistanceRemaining  float64  `json:"distanceRemaining"`
	ScheduledDeparture string   `json:"scheduledDeparture"`
	ScheduledArrival   string   `json:"scheduledArrival"`
	EstimatedArrival   string   `json:"estimatedArrival"`
	LastComputedAt     string   `json:"lastComputedAt"`
	TraceID            string   `json:"traceID"`
}
