FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy the entire monorepo to get access to packages/shared-go
COPY . .

# Change to the simulator directory
WORKDIR /app/apps/simulator

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o simulator ./cmd

FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/apps/simulator/simulator .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["./simulator"]