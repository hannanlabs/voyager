package controller

import (
	"context"
	"time"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/log"

	api "github.com/hannan/voyager/controller/api"
)

type FlightReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

const (
	FlightFinalizer = "voyager.dev/finalizer"
)

func (r *FlightReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := log.FromContext(ctx)

	flight := &api.Flight{}
	if err := r.Get(ctx, req.NamespacedName, flight); err != nil {
		if errors.IsNotFound(err) {
			log.Info("Flight resource not found. Ignoring since object must be deleted")
			return ctrl.Result{}, nil
		}
		log.Error(err, "Failed to get Flight")
		return ctrl.Result{}, err
	}

	log.Info("Reconciling Flight", "flight", flight.Name)

	if flight.DeletionTimestamp != nil {
		return r.handleDeletion(ctx, flight)
	}

	if !controllerutil.ContainsFinalizer(flight, FlightFinalizer) {
		controllerutil.AddFinalizer(flight, FlightFinalizer)
		if err := r.Update(ctx, flight); err != nil {
			log.Error(err, "Failed to add finalizer to Flight")
			return ctrl.Result{}, err
		}
		log.Info("Added finalizer to Flight")
		return ctrl.Result{Requeue: true}, nil
	}

	return r.reconcileFlight(ctx, flight)
}

func (r *FlightReconciler) reconcileFlight(ctx context.Context, flight *api.Flight) (ctrl.Result, error) {
	log := log.FromContext(ctx)

	if flight.Status.Phase == "" {
		flight.Status.Phase = api.FlightPhaseCruise
	}

	now := metav1.Now()
	flight.Status.LastComputedAt = &now

	if flight.Status.EstimatedArrival == nil {
		flight.Status.EstimatedArrival = &flight.Spec.ScheduledArrival
	}

	r.updateFlightConditions(flight)

	if err := r.Status().Update(ctx, flight); err != nil {
		log.Error(err, "Failed to update Flight status")
		return ctrl.Result{}, err
	}

	log.Info("Successfully reconciled Flight", "phase", flight.Status.Phase)

	return ctrl.Result{RequeueAfter: time.Minute * 5}, nil
}

func (r *FlightReconciler) updateFlightConditions(flight *api.Flight) {
	now := metav1.Now()

	r.setCondition(flight, api.FlightConditionReady, metav1.ConditionTrue,
		api.FlightReasonSpecValid, "Flight spec is valid and ready", now)

	r.setCondition(flight, api.FlightConditionSucceeded, metav1.ConditionFalse,
		api.FlightReasonPhaseJobRunning, "Flight is in progress", now)

	r.setCondition(flight, api.FlightConditionFailed, metav1.ConditionFalse,
		api.FlightReasonSpecValid, "Flight is operating normally", now)
}

func (r *FlightReconciler) setCondition(flight *api.Flight, conditionType string,
	status metav1.ConditionStatus, reason string, message string, now metav1.Time) {

	conditionIndex := -1
	for i, condition := range flight.Status.Conditions {
		if condition.Type == conditionType {
			conditionIndex = i
			break
		}
	}

	newCondition := metav1.Condition{
		Type:               conditionType,
		Status:             status,
		Reason:             reason,
		Message:            message,
		LastTransitionTime: now,
	}

	if conditionIndex >= 0 {
		existingCondition := &flight.Status.Conditions[conditionIndex]
		if existingCondition.Status != status {
			existingCondition.Status = status
			existingCondition.Reason = reason
			existingCondition.Message = message
			existingCondition.LastTransitionTime = now
		}
	} else {
		flight.Status.Conditions = append(flight.Status.Conditions, newCondition)
	}
}

func (r *FlightReconciler) handleDeletion(ctx context.Context, flight *api.Flight) (ctrl.Result, error) {
	log := log.FromContext(ctx)

	if controllerutil.ContainsFinalizer(flight, FlightFinalizer) {
		log.Info("Performing cleanup for Flight", "flight", flight.Name)

		now := metav1.Now()
		r.setCondition(flight, api.FlightConditionReady, metav1.ConditionFalse,
			api.FlightReasonTerminating, "Flight is being terminated", now)

		if err := r.Status().Update(ctx, flight); err != nil {
			log.Error(err, "Failed to update Flight status during deletion")
		}

		controllerutil.RemoveFinalizer(flight, FlightFinalizer)
		if err := r.Update(ctx, flight); err != nil {
			log.Error(err, "Failed to remove finalizer from Flight")
			return ctrl.Result{}, err
		}

		log.Info("Successfully cleaned up Flight", "flight", flight.Name)
	}

	return ctrl.Result{}, nil
}

func (r *FlightReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&api.Flight{}).
		Complete(r)
}
