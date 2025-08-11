FROM golang:1.22 as builder
ARG TARGETOS
ARG TARGETARCH

WORKDIR /workspace

# Copy the entire monorepo to get access to packages/shared-go  
COPY . .

# Change to the controller directory
WORKDIR /workspace/apps/controller

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH} go build -a -o manager cmd/main.go

FROM gcr.io/distroless/static:nonroot
WORKDIR /
COPY --from=builder /workspace/apps/controller/manager .
USER 65532:65532

ENTRYPOINT ["/manager"]