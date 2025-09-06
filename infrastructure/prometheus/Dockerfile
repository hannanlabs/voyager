FROM prom/prometheus:v2.54.1

COPY prometheus.yaml /etc/prometheus/prometheus.yaml

EXPOSE 9090

CMD ["--config.file=/etc/prometheus/prometheus.yaml", "--web.enable-remote-write-receiver"]

