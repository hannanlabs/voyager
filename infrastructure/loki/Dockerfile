FROM grafana/loki:3.3.0

COPY loki.yaml /etc/loki/local-config.yaml

EXPOSE 3100

CMD ["-config.file=/etc/loki/local-config.yaml"]