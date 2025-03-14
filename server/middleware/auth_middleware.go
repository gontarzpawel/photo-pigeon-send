
package middleware

import (
	"strings"
	"net/http"
	
	"github.com/gin-gonic/gin"
	
	"image-upload-server/auth"
)

// AuthMiddleware returns a middleware for authenticating JWT tokens
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		// Check if the header format is valid
		headerParts := strings.Split(authHeader, " ")
		if len(headerParts) != 2 || headerParts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			return
		}

		// Get the token
		tokenString := headerParts[1]

		// Parse and validate the token
		claims, err := auth.ParseToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Add claims to the context for other handlers to use
		c.Set("username", claims.Username)

		c.Next()
	}
}
