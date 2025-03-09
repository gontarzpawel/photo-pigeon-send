package exif

import (
	"bytes"
	"fmt"
	"time"

	"github.com/rwcarlsen/goexif/exif"
)

// ExtractImageDate extracts the date from image EXIF metadata
func ExtractImageDate(jpegData []byte) (time.Time, error) {
	// Parse EXIF data
	exifData, err := exif.Decode(bytes.NewReader(jpegData))
	if err != nil {
		return time.Time{}, fmt.Errorf("failed to decode EXIF data: %v", err)
	}

	// Get the DateTimeOriginal tag
	dateTime, err := exifData.DateTime()
	if err != nil {
		return time.Time{}, fmt.Errorf("DateTimeOriginal tag not found: %v", err)
	}

	return dateTime, nil
}
