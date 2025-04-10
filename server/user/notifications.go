
package user

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// InactivityThreshold defines how long a user can be inactive before receiving a notification (in minutes)
const InactivityThreshold = 5

// UserLastActivity tracks when users were last active
var UserLastActivity = make(map[string]time.Time)

// UserNotifications stores pending notifications for users
var UserNotifications = make(map[string][]NotificationMessage)

// NotificationMessage represents a notification to be sent to a user
type NotificationMessage struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
	Read      bool      `json:"read"`
}

// UpdateUserActivity records the last time a user was active
func UpdateUserActivity(username string) {
	UserLastActivity[username] = time.Now()
}

// HandleUpdateActivity updates the last activity time for a user
func HandleUpdateActivity(c *gin.Context) {
	username := c.GetString("username")
	if username == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	UpdateUserActivity(username)
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// HandleGetNotifications fetches all notifications for a user
func HandleGetNotifications(c *gin.Context) {
	username := c.GetString("username")
	if username == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Update user activity when they check notifications
	UpdateUserActivity(username)

	// Get notifications for this user or return empty array if none
	notifications, exists := UserNotifications[username]
	if !exists {
		notifications = []NotificationMessage{}
	}

	c.JSON(http.StatusOK, gin.H{"notifications": notifications})
}

// HandleMarkNotificationsRead marks notifications as read
func HandleMarkNotificationsRead(c *gin.Context) {
	username := c.GetString("username")
	if username == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var request struct {
		NotificationIDs []string `json:"notification_ids"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Mark specified notifications as read
	notifications, exists := UserNotifications[username]
	if exists {
		for i := range notifications {
			for _, id := range request.NotificationIDs {
				if notifications[i].ID == id {
					notifications[i].Read = true
					break
				}
			}
		}
		UserNotifications[username] = notifications
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// CheckInactivityNotifications checks for inactive users and creates notifications
func CheckInactivityNotifications() {
	now := time.Now()
	for username, lastActivity := range UserLastActivity {
		if now.Sub(lastActivity).Minutes() >= InactivityThreshold {
			// Create inactivity notification
			notification := NotificationMessage{
				ID:        generateNotificationID(),
				Type:      "inactivity",
				Message:   "You've been inactive for a while. Need help with anything?",
				CreatedAt: now,
				Read:      false,
			}
			
			// Add notification to user's queue
			UserNotifications[username] = append(UserNotifications[username], notification)
			
			// Reset last activity to avoid repeated notifications
			UpdateUserActivity(username)
		}
	}
}

// generateNotificationID creates a unique ID for notifications
func generateNotificationID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(5)
}

// randomString generates a random string of specified length
func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, n)
	for i := range result {
		result[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(result)
}
