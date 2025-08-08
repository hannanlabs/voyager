package simulator

import "math/rand"

func GenerateTraceID() string {
	const chars = "abcdef0123456789"
	result := make([]byte, 32)
	for i := range result {
		result[i] = chars[rand.Intn(len(chars))]
	}
	return string(result)
}