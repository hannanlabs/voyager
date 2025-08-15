package helpers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	mathrand "math/rand"
	"time"
)

func StartTicker(ctx context.Context, hz int, onTick func()) {
	ticker := time.NewTicker(time.Duration(1000/hz) * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			onTick()
		}
	}
}

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