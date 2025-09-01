FROM golang:1.23-alpine

WORKDIR /workspace

COPY packages/shared-go/ ./packages/shared-go/
COPY apps/simulator/ ./apps/simulator/
COPY data/airports.iata.geojson ./apps/simulator/data/airports.iata.geojson

WORKDIR /workspace/apps/simulator

RUN go build -o simulator ./cmd

EXPOSE 8080

CMD ["./simulator"]