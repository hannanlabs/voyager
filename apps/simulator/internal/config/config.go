package config

import (
	"os"
	"strconv"
)

func GetPort() string {
	port := "8080"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}
	return port
}

func GetUpdateHz() int {
	updateHz := 6
	if hz := os.Getenv("UPDATE_HZ"); hz != "" {
		if parsed, err := strconv.Atoi(hz); err == nil && parsed > 0 {
			updateHz = parsed
		}
	}
	return updateHz
}