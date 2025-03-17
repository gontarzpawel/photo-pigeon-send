
package heap

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"image-upload-server/config"
)

const (
	heapIdentifyURL = "https://heapanalytics.com/api/identify"
)

// Properties represents user properties sent to Heap
type Properties map[string]interface{}

// IdentifyRequest represents the request body to identify a user in Heap
type IdentifyRequest struct {
	AppID      string     `json:"app_id"`
	Identity   string     `json:"identity"`
	Properties Properties `json:"properties,omitempty"`
	Timestamp  int64      `json:"timestamp,omitempty"`
}

// IdentifyUser identifies a user in Heap Analytics via server-side API
func IdentifyUser(identity string, properties Properties) error {
	// Skip if Heap is not configured
	if !config.HeapEnabled {
		return fmt.Errorf("Heap analytics is not configured")
	}

	// Create the request body
	request := IdentifyRequest{
		AppID:      config.HeapAppID,
		Identity:   identity,
		Properties: properties,
		Timestamp:  time.Now().Unix() * 1000, // Heap expects milliseconds
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
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", config.HeapAPIKey))

	// Send the request
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Check response
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("heap API returned error status: %d", resp.StatusCode)
	}

	return nil
}
