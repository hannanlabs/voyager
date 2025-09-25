package telemetry

import (
	"context"
	"log"
	"runtime"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

var (
	ActiveFlightsGauge    metric.Int64ObservableGauge
	WebSocketConnections  metric.Int64UpDownCounter
	ProcessMemoryGauge    metric.Int64ObservableGauge
	ProcessCPUTimeCounter metric.Float64ObservableCounter
	GoRoutinesGauge       metric.Int64ObservableGauge
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

	ProcessMemoryGauge, err = meter.Int64ObservableGauge(
		"process_resident_memory_bytes",
		metric.WithDescription("Resident memory size in bytes"),
		metric.WithUnit("By"),
	)
	if err != nil {
		log.Printf("Failed to create process_resident_memory_bytes gauge: %v", err)
	}

	ProcessCPUTimeCounter, err = meter.Float64ObservableCounter(
		"process_cpu_seconds_total",
		metric.WithDescription("Total user and system CPU time spent in seconds"),
		metric.WithUnit("s"),
	)
	if err != nil {
		log.Printf("Failed to create process_cpu_seconds_total counter: %v", err)
	}

	GoRoutinesGauge, err = meter.Int64ObservableGauge(
		"go_goroutines",
		metric.WithDescription("Number of goroutines that currently exist"),
	)
	if err != nil {
		log.Printf("Failed to create go_goroutines gauge: %v", err)
	}

	var observableMetrics []metric.Observable
	if ActiveFlightsGauge != nil {
		observableMetrics = append(observableMetrics, ActiveFlightsGauge)
	}
	if ProcessMemoryGauge != nil {
		observableMetrics = append(observableMetrics, ProcessMemoryGauge)
	}
	if ProcessCPUTimeCounter != nil {
		observableMetrics = append(observableMetrics, ProcessCPUTimeCounter)
	}
	if GoRoutinesGauge != nil {
		observableMetrics = append(observableMetrics, GoRoutinesGauge)
	}

	if len(observableMetrics) > 0 {
		_, err = meter.RegisterCallback(
			func(ctx context.Context, o metric.Observer) error {
				if ActiveFlightsGauge != nil {
					count := flightCountFunc()
					o.ObserveInt64(ActiveFlightsGauge, int64(count))
				}

				if ProcessMemoryGauge != nil {
					var m runtime.MemStats
					runtime.ReadMemStats(&m)
					o.ObserveInt64(ProcessMemoryGauge, int64(m.Sys))
				}

				if ProcessCPUTimeCounter != nil {
					var m runtime.MemStats
					runtime.ReadMemStats(&m)
					o.ObserveFloat64(ProcessCPUTimeCounter, float64(m.PauseTotalNs)/1e9)
				}

				if GoRoutinesGauge != nil {
					o.ObserveInt64(GoRoutinesGauge, int64(runtime.NumGoroutine()))
				}

				return nil
			},
			observableMetrics...,
		)
		if err != nil {
			log.Printf("Failed to register callback for metrics: %v", err)
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
