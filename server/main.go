package main

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
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
	uploadsDir := config.UploadsDirOverriden
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		log.Fatalf("Failed to create uploads directory: %v", err)
	}

	// Load existing file hashes
	filehandler.LoadExistingHashes(uploadsDir)

	// Setup Gin router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"POST", "GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "x-heap-user-id"},
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
		authorized.POST("/upload", filehandler.HandleUpload(uploadsDir))
	}

	// Start the server
	log.Printf("Server running on port%s", config.Port)
	if err := router.Run(config.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

//package main
//
//import (
//"crypto/md5"
//"encoding/hex"
//"fmt"
//"io"
//"os"
//"path/filepath"
//)

//func main() {
//	uploadsDir := "./uploads"
//	duplicates := findDuplicateImages(uploadsDir)
//	if len(duplicates) > 0 {
//		fmt.Println("Duplicate images found:")
//		for _, dup := range duplicates {
//			fmt.Printf("Hash: %s\n", dup.hash)
//			for _, path := range dup.paths {
//				fmt.Printf(" - %s\n", path)
//			}
//		}
//	} else {
//		fmt.Println("No duplicate images found.")
//	}
//}

type duplicate struct {
	hash  string
	paths []string
}

func findDuplicateImages(rootDir string) []duplicate {
	hashes := make(map[string][]string)
	err := filepath.Walk(rootDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			hash, err := hashFile(path)
			if err != nil {
				return err
			}
			hashes[hash] = append(hashes[hash], path)
		}
		return nil
	})
	if err != nil {
		fmt.Printf("Error walking the path %q: %v\n", rootDir, err)
		return nil
	}

	var duplicates []duplicate
	for hash, paths := range hashes {
		if len(paths) > 1 {
			duplicates = append(duplicates, duplicate{hash: hash, paths: paths})
		}
	}
	return duplicates
}

func hashFile(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hasher := md5.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return "", err
	}
	return hex.EncodeToString(hasher.Sum(nil)), nil
}
