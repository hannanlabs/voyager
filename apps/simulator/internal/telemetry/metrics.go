package telemetry

import (
	"context"
	"log"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

var (
	ActiveFlightsGauge   metric.Int64ObservableGauge
	WebSocketConnections metric.Int64UpDownCounter
)

func InitMetrics(serviceName string, flightCountFunc func() int) func() {
	ctx := context.Background()

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String(serviceName),
			semconv.ServiceVersionKey.String("1.0.0"),
		),
	)
	if err != nil {
		log.Printf("Failed to create resource: %v", err)
		return func() {}
	}

	metricExporter, err := otlpmetricgrpc.New(ctx,
		otlpmetricgrpc.WithEndpoint("otel-collector:4317"),
		otlpmetricgrpc.WithInsecure(),
	)
	if err != nil {
		log.Printf("Failed to create metric exporter: %v", err)
		return func() {}
	}

	provider := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter,
			sdkmetric.WithInterval(5*time.Second))),
		sdkmetric.WithResource(res),
	)

	otel.SetMeterProvider(provider)
	meter := otel.Meter("flight-simulator")

	ActiveFlightsGauge, err = meter.Int64ObservableGauge(
		"active_flights",
		metric.WithDescription("Total number of active flights"),
	)
	if err != nil {
		log.Printf("Failed to create active_flights gauge: %v", err)
	}

	WebSocketConnections, err = meter.Int64UpDownCounter(
		"websocket_connections",
		metric.WithDescription("Number of active WebSocket connections"),
	)
	if err != nil {
		log.Printf("Failed to create websocket_connections counter: %v", err)
	}

	if ActiveFlightsGauge != nil {
		_, err = meter.RegisterCallback(
			func(ctx context.Context, o metric.Observer) error {
				count := flightCountFunc()
				o.ObserveInt64(ActiveFlightsGauge, int64(count))
				return nil
			},
			ActiveFlightsGauge,
		)
		if err != nil {
			log.Printf("Failed to register callback for active_flights gauge: %v", err)
		}
	}

	log.Printf("OpenTelemetry metrics initialized for service: %s", serviceName)

	return func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := provider.Shutdown(ctx); err != nil {
			log.Printf("Failed to shutdown MeterProvider: %v", err)
		}
	}
}
