
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// setupTestRouter sets up a test router with our handlers
func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	
	// Public routes
	r.POST("/login", handleLogin)
	
	// Protected routes
	authorized := r.Group("/")
	authorized.Use(authMiddleware())
	{
		authorized.POST("/upload", handleUpload)
	}
	
	return r
}

// createTestImage creates a dummy JPEG image for testing
func createTestImage(t *testing.T) ([]byte, error) {
	// For simple testing, we'll use a minimal valid JPEG
	// This is a very small, valid JPEG image (1x1 pixel)
	return []byte{
		0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
		0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
		0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
		0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
		0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
		0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
		0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
		0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00,
		0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00,
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x37,
		0xFF, 0xD9,
	}, nil
}

// createMultipartFormRequest creates a multipart form request with a test image
func createMultipartFormRequest(t *testing.T, url string, imageData []byte, paramName, fileName string) (*http.Request, error) {
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile(paramName, fileName)
	if err != nil {
		return nil, err
	}
	
	_, err = part.Write(imageData)
	if err != nil {
		return nil, err
	}
	
	err = writer.Close()
	if err != nil {
		return nil, err
	}
	
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req, nil
}

// TestLoginSuccess tests successful login
func TestLoginSuccess(t *testing.T) {
	router := setupTestRouter()
	
	// Create login request
	loginData := User{
		Username: "admin",
		Password: "password123",
	}
	
	jsonData, _ := json.Marshal(loginData)
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	// Perform request
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	// Assert response
	assert.Equal(t, http.StatusOK, w.Code)
	
	// Verify we got a token back
	var response LoginResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.NotEmpty(t, response.Token)
}

// TestLoginFailure tests login with invalid credentials
func TestLoginFailure(t *testing.T) {
	router := setupTestRouter()
	
	// Create login request with wrong password
	loginData := User{
		Username: "admin",
		Password: "wrongpassword",
	}
	
	jsonData, _ := json.Marshal(loginData)
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	// Perform request
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	// Assert response
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// TestUnauthorizedUpload tests upload without auth token
func TestUnauthorizedUpload(t *testing.T) {
	router := setupTestRouter()
	
	// Create a test image
	imageData, err := createTestImage(t)
	assert.NoError(t, err)
	
	// Create request
	req, err := createMultipartFormRequest(t, "/upload", imageData, "image", "test.jpg")
	assert.NoError(t, err)
	
	// Without adding auth token
	
	// Perform request
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	// Assert response
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// TestAuthorizedUpload tests upload with valid auth token
func TestAuthorizedUpload(t *testing.T) {
	router := setupTestRouter()
	
	// First, get a valid token
	loginData := User{
		Username: "admin",
		Password: "password123",
	}
	
	jsonData, _ := json.Marshal(loginData)
	loginReq, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonData))
	loginReq.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, loginReq)
	
	var loginResponse LoginResponse
	json.Unmarshal(w.Body.Bytes(), &loginResponse)
	token := loginResponse.Token
	
	// Create a test upload directory
	testUploadsDir := "./test_uploads"
	originalUploadsDir := uploadsDir
	uploadsDir = testUploadsDir
	defer func() {
		uploadsDir = originalUploadsDir
		os.RemoveAll(testUploadsDir)
	}()
	
	// Create the directory
	err := os.MkdirAll(testUploadsDir, 0755)
	assert.NoError(t, err)
	
	// Create a test image
	imageData, err := createTestImage(t)
	assert.NoError(t, err)
	
	// Create upload request
	uploadReq, err := createMultipartFormRequest(t, "/upload", imageData, "image", "test.jpg")
	assert.NoError(t, err)
	
	// Add auth token
	uploadReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	
	// Perform upload request
	uploadW := httptest.NewRecorder()
	router.ServeHTTP(uploadW, uploadReq)
	
	// Assert response
	assert.Equal(t, http.StatusCreated, uploadW.Code)
	
	// Verify the response contains success message
	var uploadResponse map[string]interface{}
	json.Unmarshal(uploadW.Body.Bytes(), &uploadResponse)
	assert.Equal(t, true, uploadResponse["success"])
}

// TestCalculateHash tests the hash calculation function
func TestCalculateHash(t *testing.T) {
	// Test with known data
	data := []byte("test data for hashing")
	hash := calculateHash(data)
	
	// Verify hash is not empty and has the correct format (hex sha256)
	assert.NotEmpty(t, hash)
	assert.Len(t, hash, 64) // SHA256 hash is 64 hex characters
}

// TestGenerateJWT tests JWT token generation
func TestGenerateJWT(t *testing.T) {
	username := "testuser"
	token, err := generateJWT(username)
	
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
	
	// Parse the token to verify it contains the correct claims
	parsedToken, err := jwt.ParseWithClaims(token, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})
	
	assert.NoError(t, err)
	assert.True(t, parsedToken.Valid)
	
	claims, ok := parsedToken.Claims.(*JWTClaims)
	assert.True(t, ok)
	assert.Equal(t, username, claims.Username)
}
