FROM grafana/grafana:latest

USER root

COPY grafana.ini /etc/grafana/grafana.ini
COPY provisioning/ /etc/grafana/provisioning/

RUN mkdir -p /var/lib/grafana/dashboards
COPY dashboards/ /var/lib/grafana/dashboards/

USER grafana

EXPOSE 3000

CMD ["grafana-server", "--config=/etc/grafana/grafana.ini", "--homepath=/usr/share/grafana"]