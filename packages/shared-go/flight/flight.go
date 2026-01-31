package flight

type Phase string

const (
	Takeoff Phase = "takeoff"
	Climb   Phase = "climb"
	Cruise  Phase = "cruise"
	Descent Phase = "descent"
	Landing Phase = "landing"
	Landed  Phase = "landed"
)

type Position struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Altitude  float64 `json:"altitude"`
}

type Velocity struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

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
