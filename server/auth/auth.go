
package auth

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"image-upload-server/config"
)

// User represents the user model
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents the response after successful login
type LoginResponse struct {
	Token string `json:"token"`
	// Add user identity info for client-side Heap tracking
	Identity struct {
		Username string `json:"username"`
		Role     string `json:"role"`
	} `json:"identity"`
}

// JWTClaims represents the claims in the JWT token
type JWTClaims struct {
	Username string `json:"username"`
	Role     string `json:"role"` // Added role for permissions
	jwt.RegisteredClaims
}

// Default users for authentication
var authUsers = map[string]string{
	"admin": "password123", // Default user - CHANGE IN PRODUCTION
	"local": "localpass",   // Local user for testing
	"bob":   "bobpass",     // New user - Bob
}

// User roles mapping
var userRoles = map[string]string{
	"admin": "admin",   // Admin role
	"local": "write",   // Write permissions
	"bob":   "default", // Default permissions
}

// HandleLogin authenticates a user and returns a JWT token
func HandleLogin(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Check if user exists and password is correct
	storedPassword, exists := authUsers[user.Username]
	if !exists || storedPassword != user.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Get user role
	role := userRoles[user.Username]
	if role == "" {
		role = "default" // Default role if not specified
	}

	// Create token
	token, err := GenerateJWT(user.Username, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	// Create response with token and identity info for Heap
	response := LoginResponse{
		Token: token,
	}
	response.Identity.Username = user.Username
	response.Identity.Role = role

	c.JSON(http.StatusOK, response)
}

// GenerateJWT creates a new JWT token for the given username
func GenerateJWT(username, role string) (string, error) {
	// Set expiration time for the token
	expirationTime := time.Now().Add(24 * time.Hour)

	// Create claims with user data
	claims := &JWTClaims{
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with the secret key
	tokenString, err := token.SignedString([]byte(config.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ParseToken parses and validates a JWT token
func ParseToken(tokenString string) (*JWTClaims, error) {
	// Parse and validate the token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(config.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	// Check if the token is valid
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}
