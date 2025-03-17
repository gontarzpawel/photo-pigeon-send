
package config

import (
	"os"
)

const (
	// Default uploads directory
	UploadsDirDefault = "./uploads"
	// Default server port
	Port = "0.0.0.0:3001"
)

var (
	// JWT secret key for token signing
	JWTSecret           string
	UploadsDirOverriden string
	// Heap Analytics settings
	HeapAppID           string
	HeapAPIKey          string
	HeapEnabled         bool
)

// Init initializes the configuration
func Init() {
	// Set JWT secret from environment or use default
	JWTSecret = getEnvOrDefault("JWT_SECRET", "your-secret-key-change-in-production")
	UploadsDirOverriden = getEnvOrDefault("UPLOADS_DIR", UploadsDirDefault)
	
	// Heap configuration
	HeapAppID = getEnvOrDefault("HEAP_APP_ID", "")
	HeapAPIKey = getEnvOrDefault("HEAP_API_KEY", "")
	HeapEnabled = HeapAppID != "" && HeapAPIKey != ""
}

// getEnvOrDefault gets environment variable or returns default if not set
func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
