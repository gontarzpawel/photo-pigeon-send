
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/dsoprea/go-exif/v3"
	"github.com/dsoprea/go-exif/v3/common"
	"github.com/dsoprea/go-jpeg-image-structure/v2"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Global map to store file hashes for duplicate detection
var (
	uploadedHashes = make(map[string]string)
	hashMutex      sync.Mutex
)

const (
	uploadsDir = "./uploads"
	port       = ":3001"
)

func main() {
	// Ensure uploads directory exists
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		log.Fatalf("Failed to create uploads directory: %v", err)
	}

	// Load existing file hashes
	loadExistingHashes()

	// Setup Gin router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Upload endpoint
	router.POST("/upload", handleUpload)

	// Start the server
	log.Printf("Server running on port%s", port)
	if err := router.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func handleUpload(c *gin.Context) {
	// Get file from form data
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image file provided"})
		return
	}
	defer file.Close()

	// Check file size
	if header.Size > 10*1024*1024 { // 10MB limit
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large (max 10MB)"})
		return
	}

	// Read file content
	buffer, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error", "message": err.Error()})
		return
	}

	// Calculate file hash
	hash := calculateHash(buffer)

	// Check for duplicates
	hashMutex.Lock()
	existingPath, exists := uploadedHashes[hash]
	hashMutex.Unlock()

	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "Image already uploaded",
			"message": "This exact image has already been uploaded previously.",
			"path":    existingPath,
		})
		return
	}

	// Extract image date from metadata
	imageDate, err := extractImageDate(buffer)
	if err != nil {
		// If we can't extract the date, use current time
		imageDate = time.Now()
	}

	// Create date-based directory structure: YYYY/MM/DD
	year := fmt.Sprintf("%d", imageDate.Year())
	month := fmt.Sprintf("%02d", imageDate.Month())
	day := fmt.Sprintf("%02d", imageDate.Day())
	dateDir := filepath.Join(uploadsDir, year, month, day)

	// Create directory if it doesn't exist
	if err := os.MkdirAll(dateDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error", "message": err.Error()})
		return
	}

	// Generate unique filename
	ext := strings.ToLower(filepath.Ext(header.Filename))
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)
	filename := fmt.Sprintf("%d-%s%s", timestamp, hash[:8], ext)
	filePath := filepath.Join(dateDir, filename)

	// Save file to disk
	if err := os.WriteFile(filePath, buffer, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error", "message": err.Error()})
		return
	}

	// Store hash to prevent duplicates
	relativePath := strings.Replace(filePath, uploadsDir, "", 1)
	hashMutex.Lock()
	uploadedHashes[hash] = relativePath
	hashMutex.Unlock()

	// Return success response
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Image uploaded successfully",
		"path":    relativePath,
		"date":    imageDate,
	})
}

// Calculate SHA256 hash of file content
func calculateHash(data []byte) string {
	hasher := sha256.New()
	hasher.Write(data)
	return hex.EncodeToString(hasher.Sum(nil))
}

// Extract date from image EXIF metadata
func extractImageDate(jpegData []byte) (time.Time, error) {
	// Parse JPEG data
	jmp := jpegstructure.NewJpegMediaParser()
	intfc, err := jmp.ParseBytes(jpegData)
	if err != nil {
		return time.Time{}, err
	}

	// Extract EXIF data
	sl, err := intfc.(*jpegstructure.SegmentList).GetExif()
	if err != nil {
		return time.Time{}, err
	}

	im, err := sl.ConstructExifBuilder()
	if err != nil {
		return time.Time{}, err
	}

	// Look for DateTimeOriginal tag
	rootIb, err := im.RootIfd()
	if err != nil {
		return time.Time{}, err
	}

	// Try to get DateTimeOriginal from Exif IFD
	exifIfd, err := rootIb.ChildWithIfdPath(exifcommon.IfdPathStandardExif)
	if err != nil {
		return time.Time{}, err
	}

	dateTimeOriginalTag, err := exifIfd.FindTagWithName("DateTimeOriginal")
	if err != nil {
		return time.Time{}, err
	}

	dateTimeValue, err := dateTimeOriginalTag.Value()
	if err != nil {
		return time.Time{}, err
	}

	dateStr, ok := dateTimeValue.(string)
	if !ok {
		return time.Time{}, fmt.Errorf("could not convert date value to string")
	}

	// EXIF datetime format: "2006:01:02 15:04:05"
	t, err := time.Parse("2006:01:02 15:04:05", dateStr)
	if err != nil {
		return time.Time{}, err
	}

	return t, nil
}

// Load existing file hashes to prevent duplicate uploads
func loadExistingHashes() {
	// Walk through all files in the uploads directory
	err := filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Read file content
		data, err := os.ReadFile(path)
		if err != nil {
			log.Printf("Error reading file %s: %v", path, err)
			return nil
		}

		// Calculate hash
		hash := calculateHash(data)
		relativePath := strings.Replace(path, uploadsDir, "", 1)

		// Store hash
		hashMutex.Lock()
		uploadedHashes[hash] = relativePath
		hashMutex.Unlock()

		return nil
	})

	if err != nil {
		log.Printf("Error loading existing hashes: %v", err)
	}

	log.Printf("Loaded %d existing file hashes", len(uploadedHashes))
}
