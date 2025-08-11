package api

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type FlightSpec struct {
	CallSign string `json:"callSign"`

	Airline string `json:"airline"`

	DepartureAirport string `json:"departureAirport"`

	ArrivalAirport string `json:"arrivalAirport"`

	ScheduledDeparture metav1.Time `json:"scheduledDeparture"`

	ScheduledArrival metav1.Time `json:"scheduledArrival"`
}

type FlightPhase string

const (
	FlightPhaseTakeoff FlightPhase = "takeoff"
	FlightPhaseClimb   FlightPhase = "climb"
	FlightPhaseCruise  FlightPhase = "cruise"
	FlightPhaseDescent FlightPhase = "descent"
	FlightPhaseLanding FlightPhase = "landing"
)

type FlightStatus struct {
	Phase FlightPhase `json:"phase,omitempty"`

	EstimatedArrival *metav1.Time `json:"estimatedArrival,omitempty"`

	LastComputedAt *metav1.Time `json:"lastComputedAt,omitempty"`

	Conditions []metav1.Condition `json:"conditions,omitempty" patchStrategy:"merge" patchMergeKey:"type"`
}

const (
	FlightConditionReady = "Ready"

	FlightConditionSucceeded = "Succeeded"

	FlightConditionFailed = "Failed"
)

const (
	FlightReasonSpecValid          = "SpecValid"
	FlightReasonWaitingForJob      = "WaitingForJob"
	FlightReasonPhaseJobRunning    = "PhaseJobRunning"
	FlightReasonAllPhasesSucceeded = "AllPhasesSucceeded"
	FlightReasonRetriesExceeded    = "RetriesExceeded"
	FlightReasonTerminating        = "Terminating"
)

type Flight struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   FlightSpec   `json:"spec,omitempty"`
	Status FlightStatus `json:"status,omitempty"`
}

type FlightList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Flight `json:"items"`
}