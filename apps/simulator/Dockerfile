FROM golang:1.23-alpine AS build

WORKDIR /src

COPY apps/simulator/ ./
COPY data/airports.iata.geojson ./data/airports.iata.geojson

RUN CGO_ENABLED=0 go build -o /simulator ./cmd

FROM alpine:3.20

COPY --from=build /simulator /simulator
COPY --from=build /src/data/airports.iata.geojson /data/airports.iata.geojson

EXPOSE 8080

CMD ["/simulator"]
