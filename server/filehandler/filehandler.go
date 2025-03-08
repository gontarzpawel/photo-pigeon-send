
package filehandler

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

	"github.com/gin-gonic/gin"
	
	"image-upload-server/config"
	"image-upload-server/exif"
)

// Global map to store file hashes for duplicate detection
var (
	uploadedHashes = make(map[string]string)
	hashMutex      sync.Mutex
)

// HandleUpload handles the file upload request
func HandleUpload(c *gin.Context) {
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
	hash := CalculateHash(buffer)

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
	imageDate, err := exif.ExtractImageDate(buffer)
	if err != nil {
		log.Printf("Failed to extract date from image: %v", err)
		imageDate = time.Now()
	} else {
		log.Printf("Successfully extracted image date: %v", imageDate)
	}

	// Create date-based directory structure: YYYY/MM/DD
	year := fmt.Sprintf("%d", imageDate.Year())
	month := fmt.Sprintf("%02d", imageDate.Month())
	day := fmt.Sprintf("%02d", imageDate.Day())
	dateDir := filepath.Join(config.UploadsDir, year, month, day)

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
	relativePath := strings.Replace(filePath, config.UploadsDir, "", 1)
	hashMutex.Lock()
	uploadedHashes[hash] = relativePath
	hashMutex.Unlock()

	// Get username from context (set by authMiddleware)
	username, _ := c.Get("username")

	// Return success response
	c.JSON(http.StatusCreated, gin.H{
		"success":  true,
		"message":  "Image uploaded successfully",
		"path":     relativePath,
		"date":     imageDate,
		"uploader": username,
	})
}

// CalculateHash calculates SHA256 hash of file content (exported for testing)
func CalculateHash(data []byte) string {
	hasher := sha256.New()
	hasher.Write(data)
	return hex.EncodeToString(hasher.Sum(nil))
}

// LoadExistingHashes loads existing file hashes to prevent duplicate uploads
func LoadExistingHashes() {
	// Walk through all files in the uploads directory
	err := filepath.Walk(config.UploadsDir, func(path string, info os.FileInfo, err error) error {
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
		hash := CalculateHash(data)
		relativePath := strings.Replace(path, config.UploadsDir, "", 1)

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
