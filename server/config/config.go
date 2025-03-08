
package config

import (
	"os"
)

const (
	// Default uploads directory
	UploadsDir = "./uploads"
	// Default server port
	Port = ":3001"
)

var (
	// JWT secret key for token signing
	JWTSecret string
)

// Init initializes the configuration
func Init() {
	// Set JWT secret from environment or use default
	JWTSecret = getEnvOrDefault("JWT_SECRET", "your-secret-key-change-in-production")
}

// getEnvOrDefault gets environment variable or returns default if not set
func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
