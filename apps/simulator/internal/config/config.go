package config

import (
	"os"
	"strconv"
	"strings"
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

func GetAllowedOrigins() []string {
	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		return []string{}
	}
	return strings.Split(origins, ",")
}