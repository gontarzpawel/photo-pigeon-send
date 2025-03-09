package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"image-upload-server/auth"
	"image-upload-server/config"
	"image-upload-server/filehandler"
	"image-upload-server/middleware"
)

func main() {
	// Initialize configuration
	config.Init()

	// Ensure uploads directory exists
	if err := os.MkdirAll(config.UploadsDir, 0755); err != nil {
		log.Fatalf("Failed to create uploads directory: %v", err)
	}

	// Load existing file hashes
	filehandler.LoadExistingHashes()

	// Setup Gin router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"POST", "GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Public routes
	router.POST("/login", auth.HandleLogin)

	// Protected routes
	authorized := router.Group("/")
	authorized.Use(middleware.AuthMiddleware())
	{
		authorized.POST("/upload", filehandler.HandleUpload)
	}

	// Start the server
	log.Printf("Server running on port%s", config.Port)
	if err := router.Run(config.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
