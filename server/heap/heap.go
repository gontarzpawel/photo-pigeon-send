package heap

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"image-upload-server/config"
)

const (
	heapIdentifyURL = "https://heapanalytics.com/api/v1/identify"
)

// Properties represents user properties sent to Heap
type Properties map[string]interface{}

// IdentifyRequest represents the request body to identify a user in Heap
type IdentifyRequest struct {
	AppID    string `json:"app_id"`
	Identity string `json:"identity"`
	UserID   string `json:"user_id"`
}

// IdentifyUser identifies a user in Heap Analytics via server-side API
func IdentifyUser(identity string, userID string) error {
	// Skip if Heap is not configured
	if !config.HeapEnabled {
		return fmt.Errorf("Heap analytics is not configured")
	}

	// Create the request body
	request := IdentifyRequest{
		AppID:    config.HeapAppID,
		Identity: fmt.Sprintf("%s-server-side", identity),
		UserID:   userID,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", heapIdentifyURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	//req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", config.HeapAPIKey))

	// Send the request
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Check response
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("heap API response body error: %d", err)
		}

		return fmt.Errorf("heap API returned error status: %d , body: %s", resp.StatusCode, string(body))
	}

	return nil
}
