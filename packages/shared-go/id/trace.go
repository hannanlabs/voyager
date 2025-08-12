package id

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	mathrand "math/rand"
	"time"
)

func GenerateTraceID() string {
	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		now := time.Now().UnixNano()
		mathrand.Seed(now)
		return fmt.Sprintf("%016x%016x", now, mathrand.Int63())
	}
	return hex.EncodeToString(bytes)
}
