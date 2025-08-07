# 🛫

## RFC - Voyager

_A Global Air Traffic Simulation Orchestrated via Kubernetes_

The intent of Voyager is to simulate air traffic across the globe using event driven
infrastructure and lightweight flight physics. This project will serve as both a
technical showcase of distributed system primitives and a full stack observability
demo.

## User Experience :

A 3D globe with thousands of flights going to and from airports all over the world.
Built with React Map GL, the frontend renders a realtime globe of flights in motion. A
WebSocket pipe streams flight state from the backend. Selecting a flight reveals the
following boarding pass :


## Kubernetes CRD :

Kubernetes Custom Resource Definitions will allow us to define an object Flight
within our cluster using Kubebuilder to create Go-structs that are type safe. Here is
our object Flight :

```
apiVersion: voyager/v
kind: Flight
metadata:
name: Flight BANF
finalizers: ["voyager.dev/finalizer"] # added by controller
spec:
departureAirport: JFK
arrivalAirport: LAX
airline: United
phase: takeoff
scheduledDeparture: "2025-07-25T14:00:00Z"
scheduledArrival: "2025-07-25T18:20:00Z"
windVector: { x: 2.3, y: -1.5, z: 0.1 }
status:
velocity: { x: 203.5, y: -10.2, z: 0.0 }
liftForce: 3200
```

```
dragForce: 1100
altitude: 11500
distanceRemaining: 1800
fuelRemaining: 5600
estimatedArrival: "2025-07-25T18:32:00Z"
lastComputedAt: "2025-07-25T14:23:00Z"
traceID: "f3a9c1e7f12c4d3a9bc2a47db9e30b7c"
jobRef: "default/flight-banf351-cruise- 7 c9d"
conditions:
```
- type: Ready
status: "True"
reason: PhaseJobRunning
lastTransitionTime: "2025-07-25T14:21:15Z"
- type: Succeeded
status: "False"
reason: InProgress
lastTransitionTime: "2025-07-25T14:21:15Z"

## Equations To Determine Status Values :

### Velocity :

v = v0 + DeltaT * (a_thrust + a_drag + a_wind)
Where:

```
v0= prior velocity vector (from last status update)
a_thrust = T / m (thrust force / mass)
a_drag = -D / m (drag opposes motion)
a_wind = vector field sampled from wind map at current position
DeltaT = time since last simulation step
```
### Lift Force :

L = 0.5 * rho * v^2 * S * C_L
Where:

```
rho = air density (kg/m³)
```

```
v = airspeed (m/s)
S = wing surface area (m²)
C_L = coefficient of lift
```
### Drag Force :

D = 0.5 * rho * v^2 * S * C_D
Where:

```
C_D = coefficient of drag
```
### Phase Progress :

```
phaseProgress = (tNow - tStart) / (tEnd - tStart)
```
Where:

```
tStart = time phase began
tNow = current time
tEnd = expected phase end time
Output is a float from 0.0 (just started) to 1.0 (completed)
```
### Last Computed At :

Simple timestamp of when the status fields were last updated.

## Conditions :

```
Phase / Event Ready Succeeded Failed Reason
Flight created False False False WaitingForJob
Job scheduled
& running True False False PhaseJobRunning
Mid-cruise
progress True False False PhaseJobRunning
Landing
complete True True False AllPhasesSucceeded
Terminal failure False False True RetriesExceeded
Deletion in
progress False True/False False/True Terminating
```

## gRPC API Surface :

## Kubernetes Air Traffic Controller :

A gRPC service defined using Protobuf exposes CRUD endpoints for flight
operations. The Go based controller listens and reconciles CRD changes into
Kubernetes native actions. Each Flight CRD spawns a Job which runs a physics
simulation container writing telemetry to a shared volume consumed by the
controller.


## Logging :


```
Layer Tool Purpose
Metrics Prometheus CPU, memory, flight phase
Visualization Grafana Dashboards, alerts
Logs Loki Pod logs, crash diagnostics
Tracing OpenTelemetry Pod trace waterfall
```
## Poisson Burst Traffic :

Each flight is defined as a short lived Kubernetes Job that runs a simplified vector
field approximation of wind flow based on Navier–Stokes inspired dynamics,
enough to simulate plausible drag, lift, and trajectory responses without full CFD
overhead. Wind currents are generated using realtime global datasets from NOAA.

We use Poisson Burst Traffic to model realistic, randomly timed flight spawns.
Additionally, we define burst clauses around high traffic airports (JFK at 5PM) to
simulate congestion peaks. This serves as a load testing mechanism that stresses
autoscalers, validates controller responsiveness, and mirrors the unpredictable,
bursty nature of real world air traffic.

## Chaosmesh :

This will allow us to randomly destroy pods containing an individual flight and
simulate how the system reacts to it gracefully. We'll simulate pod deletion, network
delay, and node failures to observe system resiliency and controller behavior. We
expect the controller to automatically reschedule any lost flights, ensuring eventual
convergence of the control plane. These tests validate idempotence and fault
tolerance.

## Auto Scaling :

Using KEDA (Kubernetes Event Driven Autoscaler) to auto scale as number of
flights grows and HPA to scale based on CPU and memory needs.

## Development :

Tilt enables local reconciliation and live reload on file change. Local k3d clusters
will simulate core control flow without cloud billing.


## Terraform :

Provides spin-up of our Kubernetes Cluster, and ensures multi-region, multi-tolerant
system. Allows us to create AWS EKS cluster, provision S3 for logs and artifacts,
and IAM for permissions for our services.

## CI / CD :

Continuous Integration / Continuous Deployment will allow us to make sure our
code conforms to basic hygiene standards and provide us the ability to build docker
images, push to GHCR, apply manifests to EKS, and run testing / lints.

## Transition from Production Grade :

Initially, we will use full production grade Kubernetes Cluster deployed on AWS EKS
(Elastic Kubernetes Service). We will provision multi-region, multi-tolerant, and
simulate at least 10k flights with p99 latency. Once we have demonstrated viable
functionality, in a week, we will transition off to a less performant EC2 instance and
run a VM k3d instance that simulates around 50 flights. This will still provide a POC,
but be significantly cheaper to keep up as a demo showcase in the future.

## Outlook :

Voyager serves as an educational blueprint for understanding CRDs, controller
reconciliation, and distributed system state transitions inside Kubernetes. In doing
so, Voyager becomes a showcase of distributed systems at scale, end to end
observability from metrics to logs to traces, and a foundation for more advanced
physics in CFD (Computational Fluid Dynamics).

