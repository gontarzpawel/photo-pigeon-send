
package user

import (
	"image-upload-server/auth"
	"log"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

var (
	// UserDB is the global user database
	UserDB *UserDatabase
)

// InitUserDatabase initializes the user database
func InitUserDatabase(dataDir string) error {
	dbPath := filepath.Join(dataDir, "users.json")
	var err error
	UserDB, err = NewUserDatabase(dbPath)
	if err != nil {
		return err
	}

	log.Printf("User database initialized at %s", dbPath)
	return nil
}

// HandleRegister handles user registration
func HandleRegister(c *gin.Context) {
	// Parse the registration request
	var registerRequest struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		Email    string `json:"email" binding:"required"`
	}

	if err := c.BindJSON(&registerRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "success": false})
		return
	}

	// Add the user to the database
	err := UserDB.AddUser(registerRequest.Username, registerRequest.Password, registerRequest.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "success": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User registered successfully",
	})
}

// HandleLogin handles user authentication
func HandleLogin(c *gin.Context) {
	var loginRequest struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.BindJSON(&loginRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate credentials
	if !UserDB.ValidateCredentials(loginRequest.Username, loginRequest.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Get the user
	user, _ := UserDB.GetUser(loginRequest.Username)

	// Generate a token for the user
	token, err := auth.GenerateToken(loginRequest.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Return the token to the client
	c.JSON(http.StatusOK, gin.H{"token": token, "identity": gin.H{"username": loginRequest.Username, "role": user.Role}})
}
