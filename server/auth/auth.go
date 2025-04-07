package auth

import (
	"errors"
	"fmt"
	"image-upload-server/config"
	"log"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

// Claims represents the JWT claims
type Claims struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	jwt.StandardClaims
}

// HandleLogin handles user authentication
func HandleLogin(c *gin.Context) {
	var loginRequest struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.BindJSON(&loginRequest); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request format"})
		return
	}

	// In a real application, you would validate the username and password against a database.
	// For this example, we'll just check if the username and password are not empty.
	if loginRequest.Username == "" || loginRequest.Password == "" {
		c.JSON(401, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate a token for the user
	token, err := GenerateToken(loginRequest.Username)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
	}

	// Return the token to the client
	c.JSON(200, gin.H{"token": token, "identity": gin.H{"username": loginRequest.Username, "role": "default"}})
}

// GenerateToken creates a new JWT token for the given user
func GenerateToken(username string) (string, error) {
	// Set the expiration time for the token
	expirationTime := time.Now().Add(12 * time.Hour)

	// Create the JWT claims
	claims := &Claims{
		Username: username,
		Email:    fmt.Sprintf("%s@example.com", username), // Mock email
		Role:     "default",                               // Mock role
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
			Issuer:    "image-upload-server",
		},
	}

	// Sign the token with the secret key
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.JWTSecret))
	if err != nil {
		log.Printf("Failed to sign token: %v", err)
		return "", err
	}

	return tokenString, nil
}

// ParseToken parses and validates a JWT token
func ParseToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Return the secret key for signing
		return []byte(config.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// GetUserClaimsFromContext extracts user claims from the Gin context
func GetUserClaimsFromContext(c *gin.Context) (*Claims, error) {
	// Get the Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return nil, errors.New("authorization header is missing")
	}
	
	// Extract token from the header
	tokenString := authHeader[7:] // Remove "Bearer " prefix
	
	// Parse and validate the token
	claims, err := ParseToken(tokenString)
	if err != nil {
		return nil, err
	}
	
	return claims, nil
}
