package simulator

type FlightPosition struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Altitude  float64 `json:"altitude"`
}

type FlightVelocity struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type FlightState struct {
	ID                 string         `json:"id"`
	CallSign           string         `json:"callSign"`
	Airline            string         `json:"airline"`
	DepartureAirport   string         `json:"departureAirport"`
	ArrivalAirport     string         `json:"arrivalAirport"`
	Phase              string         `json:"phase"`
	Position           FlightPosition `json:"position"`
	Velocity           FlightVelocity `json:"velocity"`
	Bearing            float64        `json:"bearing"`
	Speed              float64        `json:"speed"`
	Altitude           float64        `json:"altitude"`
	Progress           float64        `json:"progress"`
	ScheduledDeparture string         `json:"scheduledDeparture"`
	ScheduledArrival   string         `json:"scheduledArrival"`
	EstimatedArrival   string         `json:"estimatedArrival"`
	LastComputedAt     string         `json:"lastComputedAt"`
	TraceID            string         `json:"traceID"`
}

type FlightUpdatesMsg struct {
	Type    string        `json:"type"`
	Flights []FlightState `json:"flights"`
}

type InitialStateMsg struct {
	Type    string        `json:"type"`
	Flights []FlightState `json:"flights"`
}