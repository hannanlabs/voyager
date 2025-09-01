package telemetry

import (
	"context"
	"log"
	"time"

	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploggrpc"
	otellog "go.opentelemetry.io/otel/log"
	"go.opentelemetry.io/otel/log/global"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

var Logger otellog.Logger

func LogInfo(message string, attrs ...any) {
	if Logger != nil {
		ctx := context.Background()
		record := otellog.Record{}
		record.SetBody(otellog.StringValue(message))
		record.SetSeverity(otellog.SeverityInfo)
		record.SetTimestamp(time.Now())

		for i := 0; i < len(attrs); i += 2 {
			if i+1 < len(attrs) {
				key := attrs[i].(string)
				value := attrs[i+1]
				record.AddAttributes(otellog.String(key, toString(value)))
			}
		}

		Logger.Emit(ctx, record)
	}
}

func LogError(message string, err error, attrs ...any) {
	if Logger != nil {
		ctx := context.Background()
		record := otellog.Record{}
		record.SetBody(otellog.StringValue(message))
		record.SetSeverity(otellog.SeverityError)
		record.SetTimestamp(time.Now())

		if err != nil {
			record.AddAttributes(otellog.String("error", err.Error()))
		}

		for i := 0; i < len(attrs); i += 2 {
			if i+1 < len(attrs) {
				key := attrs[i].(string)
				value := attrs[i+1]
				record.AddAttributes(otellog.String(key, toString(value)))
			}
		}

		Logger.Emit(ctx, record)
	}
}

func toString(v any) string {
	if str, ok := v.(string); ok {
		return str
	}
	return ""
}

func InitLogs(serviceName string) func() {
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

	logExporter, err := otlploggrpc.New(ctx,
		otlploggrpc.WithEndpoint("otel-collector:4317"),
		otlploggrpc.WithInsecure(),
	)
	if err != nil {
		log.Printf("Failed to create log exporter: %v", err)
		return func() {}
	}

	loggerProvider := sdklog.NewLoggerProvider(
		sdklog.WithProcessor(sdklog.NewBatchProcessor(logExporter)),
		sdklog.WithResource(res),
	)

	global.SetLoggerProvider(loggerProvider)
	Logger = loggerProvider.Logger("flight-simulator")

	log.Printf("OpenTelemetry logging initialized for service: %s", serviceName)

	return func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := loggerProvider.Shutdown(ctx); err != nil {
			log.Printf("Failed to shutdown LoggerProvider: %v", err)
		}
	}
}
