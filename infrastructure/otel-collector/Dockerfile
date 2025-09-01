FROM otel/opentelemetry-collector-contrib:0.111.0

COPY config.yaml /etc/otelcol-contrib/config.yaml

EXPOSE 4317 4318

CMD ["--config=/etc/otelcol-contrib/config.yaml"]