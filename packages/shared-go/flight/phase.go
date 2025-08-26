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
