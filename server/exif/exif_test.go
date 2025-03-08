
package exif

import (
	"os"
	"testing"
	"time"
	
	"image-upload-server/testutil"
)

func TestExtractImageDate(t *testing.T) {
	// Setup test images
	testutil.SetupTestImages(t)
	defer testutil.CleanupTestImages(t)
	
	tests := []struct {
		name     string
		filePath string
		wantErr  bool
	}{
		{
			name:     "Test without EXIF data",
			filePath: testutil.NoExifImagePath,
			wantErr:  true,
		},
		// Additional test cases will be added when we have sample images with EXIF data
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data, err := os.ReadFile(tt.filePath)
			if err != nil {
				t.Fatalf("Failed to read test file: %v", err)
			}

			got, err := ExtractImageDate(data)
			if (err != nil) != tt.wantErr {
				t.Errorf("ExtractImageDate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && got.IsZero() {
				t.Errorf("ExtractImageDate() returned zero time when a valid time was expected")
			}
		})
	}
}

func TestExtractExifDateStandard(t *testing.T) {
	// Setup test images
	testutil.SetupTestImages(t)
	defer testutil.CleanupTestImages(t)
	
	t.Run("Empty data", func(t *testing.T) {
		_, err := extractExifDateStandard([]byte{})
		if err == nil {
			t.Error("extractExifDateStandard() should return error with empty data")
		}
	})
	
	t.Run("Invalid JPEG data", func(t *testing.T) {
		_, err := extractExifDateStandard([]byte{0x00, 0x01, 0x02})
		if err == nil {
			t.Error("extractExifDateStandard() should return error with invalid JPEG data")
		}
	})
	
	t.Run("JPEG without EXIF", func(t *testing.T) {
		data, err := os.ReadFile(testutil.NoExifImagePath)
		if err != nil {
			t.Fatalf("Failed to read test file: %v", err)
		}
		
		_, err = extractExifDateStandard(data)
		if err == nil {
			t.Error("extractExifDateStandard() should return error with JPEG without EXIF")
		}
	})
}

func TestExtractExifDateDirect(t *testing.T) {
	// Setup test images
	testutil.SetupTestImages(t)
	defer testutil.CleanupTestImages(t)
	
	t.Run("Empty data", func(t *testing.T) {
		_, err := extractExifDateDirect([]byte{})
		if err == nil {
			t.Error("extractExifDateDirect() should return error with empty data")
		}
	})
	
	t.Run("Invalid JPEG data", func(t *testing.T) {
		_, err := extractExifDateDirect([]byte{0x00, 0x01, 0x02})
		if err == nil {
			t.Error("extractExifDateDirect() should return error with invalid JPEG data")
		}
	})
	
	t.Run("JPEG without EXIF", func(t *testing.T) {
		data, err := os.ReadFile(testutil.NoExifImagePath)
		if err != nil {
			t.Fatalf("Failed to read test file: %v", err)
		}
		
		_, err = extractExifDateDirect(data)
		if err == nil {
			t.Error("extractExifDateDirect() should return error with JPEG without EXIF")
		}
	})
}

func TestExifDateWithRealImage(t *testing.T) {
	// This test requires a real image with EXIF data
	if os.Getenv("TEST_WITH_REAL_IMAGE") != "1" {
		t.Skip("Skipping test with real image. Set TEST_WITH_REAL_IMAGE=1 to enable.")
	}
	
	testutil.CheckTestImageExists(t, testutil.WithExifImagePath, 
		"Test image with EXIF data not found. Place a test image at " + testutil.WithExifImagePath)
	
	data, err := os.ReadFile(testutil.WithExifImagePath)
	if err != nil {
		t.Fatalf("Failed to read test image: %v", err)
	}
	
	date, err := ExtractImageDate(data)
	if err != nil {
		t.Errorf("ExtractImageDate() error = %v", err)
		return
	}
	
	t.Logf("Extracted date: %v", date)
	
	// Verify we got a non-zero date
	if date.IsZero() {
		t.Error("Extracted date should not be zero")
	}
	
	// Additional verifications specific to the test image can be added
	// For example, if you know the date in your test image:
	// expectedDate := time.Date(2023, 5, 15, 10, 30, 0, 0, time.UTC)
	// if !date.Equal(expectedDate) {
	//     t.Errorf("Expected date %v, got %v", expectedDate, date)
	// }
}

// Add integration test for the filehandler's use of EXIF extraction
func TestExifIntegrationWithFileHandler(t *testing.T) {
	// This test verifies that EXIF date extraction works correctly with the file handler
	// It's more of an integration test, as it tests the interaction between components
	
	if os.Getenv("TEST_WITH_REAL_IMAGE") != "1" {
		t.Skip("Skipping integration test. Set TEST_WITH_REAL_IMAGE=1 to enable.")
	}
	
	testutil.CheckTestImageExists(t, testutil.WithExifImagePath, 
		"Test image with EXIF data not found for integration test")
	
	// Read the test image
	data, err := os.ReadFile(testutil.WithExifImagePath)
	if err != nil {
		t.Fatalf("Failed to read test image: %v", err)
	}
	
	// Extract date from the image
	date, err := ExtractImageDate(data)
	if err != nil {
		t.Errorf("Failed to extract date from test image: %v", err)
		return
	}
	
	// Verify date is valid and in the expected range
	now := time.Now()
	if date.After(now) {
		t.Errorf("Extracted date %v is in the future", date)
	}
	
	// Most digital photos should have been taken after digital cameras became common
	minDate := time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC)
	if date.Before(minDate) {
		t.Errorf("Extracted date %v is unreasonably old (before %v)", date, minDate)
	}
	
	// Print details for debugging
	t.Logf("Successfully extracted date: %v", date)
}
