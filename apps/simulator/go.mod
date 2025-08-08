module github.com/hannan/voyager/simulator

go 1.22

require (
	github.com/gorilla/websocket v1.5.3
	github.com/hannan/voyager/shared-go v0.0.0
)

replace github.com/hannan/voyager/shared-go => ../../packages/shared-go
