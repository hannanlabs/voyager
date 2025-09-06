FROM grafana/tempo:2.6.1

COPY tempo.yaml /etc/tempo.yaml

EXPOSE 3200 4317

CMD ["-config.file=/etc/tempo.yaml"]