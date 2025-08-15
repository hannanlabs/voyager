package airports

import "github.com/hannan/voyager/shared-go/flight"

type Repository interface {
	Load(path string) error
	RawJSON() []byte
	ETag() string
	Positions() map[string]flight.Position
	Codes() []string
	IsLoaded() bool
	Reload() error
}