
package subscription

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image-upload-server/auth"
	"image-upload-server/config"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CheckoutItem struct {
	ID       string `json:"id"`
	Quantity int    `json:"quantity"`
}

type CheckoutRequest struct {
	Items []CheckoutItem `json:"items"`
}

type StripeCheckoutSession struct {
	URL string `json:"url"`
}

type StripeSubscriptionRequest struct {
	CustomerEmail string            `json:"customer_email"`
	LineItems     []StripeLineItem  `json:"line_items"`
	Mode          string            `json:"mode"`
	SuccessURL    string            `json:"success_url"`
	CancelURL     string            `json:"cancel_url"`
	Metadata      map[string]string `json:"metadata,omitempty"`
}

type StripeLineItem struct {
	Price    string `json:"price"`
	Quantity int    `json:"quantity"`
}

var planIdToPriceId = map[string]string{
	"basic":        "price_basic",       // Replace with actual Stripe price IDs
	"premium":      "price_premium",     // Replace with actual Stripe price IDs
	"professional": "price_professional", // Replace with actual Stripe price IDs
}

// HandleSubscriptionCheckout creates a Stripe subscription checkout session
func HandleSubscriptionCheckout(c *gin.Context) {
	// Get user info from context (set by auth middleware)
	username, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var req CheckoutRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Get user details from token
	claims, err := auth.GetUserClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unable to get user information"})
		return
	}

	// Find the first item to process as subscription
	if len(req.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No items provided for checkout"})
		return
	}

	item := req.Items[0]
	stripePrice, exists := planIdToPriceId[item.ID]
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan ID"})
		return
	}

	// Create subscription request to Stripe
	stripeReq := StripeSubscriptionRequest{
		CustomerEmail: claims.Email,
		LineItems: []StripeLineItem{
			{
				Price:    stripePrice,
				Quantity: item.Quantity,
			},
		},
		Mode:       "subscription",
		SuccessURL: fmt.Sprintf("%s/subscription-success", c.Request.Header.Get("Origin")),
		CancelURL:  fmt.Sprintf("%s/subscription-canceled", c.Request.Header.Get("Origin")),
		Metadata: map[string]string{
			"username": username.(string),
		},
	}

	// Convert request to JSON
	reqBody, err := json.Marshal(stripeReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create checkout request"})
		return
	}

	// Call Stripe API to create checkout session
	// This is a placeholder. In a real implementation, you'd use a Stripe library or API call
	// For demo purposes, we'll just return a mock success response
	log.Printf("Would send subscription request to Stripe for user %s, plan %s", username, item.ID)
	
	// Return a mock URL for demo purposes
	// In production, this would come from the Stripe API response
	c.JSON(http.StatusOK, gin.H{
		"url": fmt.Sprintf("https://checkout.stripe.com/mock-session?plan=%s&user=%s", item.ID, username),
	})
}
