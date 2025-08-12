FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY . .

WORKDIR /app/apps/simulator

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o simulator ./cmd

FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/apps/simulator/simulator .
COPY --from=builder /app/data/airports.iata.geojson ./data/airports.iata.geojson

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["./simulator"]