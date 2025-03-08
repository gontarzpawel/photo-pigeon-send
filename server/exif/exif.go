
package exif

import (
	"fmt"
	"log"
	"time"

	"github.com/dsoprea/go-exif/v3"
	exifcommon "github.com/dsoprea/go-exif/v3/common"
	"github.com/dsoprea/go-jpeg-image-structure/v2"
)

// ExtractImageDate extracts the date from image EXIF metadata
func ExtractImageDate(jpegData []byte) (time.Time, error) {
	// Try several strategies to extract the date
	
	// First try the standard EXIF extraction
	date, err := extractExifDateStandard(jpegData)
	if err == nil {
		return date, nil
	}
	
	log.Printf("Standard EXIF extraction failed: %v, trying alternative method", err)
	
	// If that fails, try a more direct approach
	date, err = extractExifDateDirect(jpegData)
	if err == nil {
		return date, nil
	}
	
	log.Printf("All EXIF extraction methods failed: %v", err)
	return time.Time{}, fmt.Errorf("could not extract date from image")
}

// Standard EXIF extraction approach
func extractExifDateStandard(jpegData []byte) (time.Time, error) {
	// Parse JPEG data
	jmp := jpegstructure.NewJpegMediaParser()
	intfc, err := jmp.ParseBytes(jpegData)
	if err != nil {
		return time.Time{}, fmt.Errorf("failed to parse JPEG: %v", err)
	}

	segmentList, ok := intfc.(*jpegstructure.SegmentList)
	if !ok {
		return time.Time{}, fmt.Errorf("couldn't convert interface to SegmentList")
	}

	exifSegment, err := segmentList.FindExif()
	if err != nil {
		return time.Time{}, fmt.Errorf("couldn't find EXIF segment: %v", err)
	}

	exifData, err := exifSegment.MarkingSegment.Data()
	if err != nil {
		return time.Time{}, fmt.Errorf("couldn't get EXIF data: %v", err)
	}

	// Parse EXIF data
	im, err := exif.NewIfdMappingWithStandard()
	if err != nil {
		return time.Time{}, fmt.Errorf("couldn't create IFD mapping: %v", err)
	}

	ti := exif.NewTagIndex()
	_, index, err := exif.Collect(im, ti, exifData)
	if err != nil {
		return time.Time{}, fmt.Errorf("couldn't collect EXIF data: %v", err)
	}

	// Try to find DateTimeOriginal tag first (most accurate for photos)
	ifd, err := index.RootIfd.ChildWithIfdPath(exifcommon.IfdStandardExifPath)
	if err != nil {
		return time.Time{}, fmt.Errorf("couldn't find EXIF IFD: %v", err)
	}

	// Try DateTimeOriginal (preferred)
	results, err := ifd.FindTagWithName("DateTimeOriginal")
	if err != nil || len(results) == 0 {
		// If DateTimeOriginal not found, try DateTime
		log.Printf("DateTimeOriginal not found, trying DateTime")
		results, err = index.RootIfd.FindTagWithName("DateTime")
		if err != nil || len(results) == 0 {
			return time.Time{}, fmt.Errorf("couldn't find any DateTime tags")
		}
	}

	// Get the date time string
	dateTimeTag := results[0]
	dateTimeValue, err := dateTimeTag.Value()
	if err != nil {
		return time.Time{}, fmt.Errorf("couldn't get tag value: %v", err)
	}

	dateStr, ok := dateTimeValue.(string)
	if !ok {
		return time.Time{}, fmt.Errorf("couldn't convert date value to string")
	}

	// EXIF datetime format: "2006:01:02 15:04:05"
	t, err := time.Parse("2006:01:02 15:04:05", dateStr)
	if err != nil {
		return time.Time{}, fmt.Errorf("couldn't parse date string '%s': %v", dateStr, err)
	}

	return t, nil
}

// Alternative approach to extract EXIF date
func extractExifDateDirect(jpegData []byte) (time.Time, error) {
	// First check if we can find any EXIF data at all in the JPEG
	rawExif, err := exif.SearchAndExtractExif(jpegData)
	if err != nil {
		return time.Time{}, fmt.Errorf("couldn't extract EXIF data: %v", err)
	}

	// Parse the EXIF data
	im, err := exif.NewIfdMappingWithStandard()
	if err != nil {
		return time.Time{}, err
	}

	ti := exif.NewTagIndex()
	_, index, err := exif.Collect(im, ti, rawExif)
	if err != nil {
		return time.Time{}, fmt.Errorf("couldn't collect EXIF data: %v", err)
	}

	// Check for all possible date fields
	possibleDateFields := []struct {
		ifdPath    []uint16
		fieldName  string
		isDateTime bool
	}{
		{exifcommon.IfdStandardExifPath, "DateTimeOriginal", true},
		{exifcommon.IfdStandardExifPath, "DateTimeDigitized", true},
		{[]uint16{}, "DateTime", true}, // Root IFD
		// Add GPS date and time if needed later
	}

	for _, field := range possibleDateFields {
		var ifd *exif.Ifd
		var err error

		if len(field.ifdPath) > 0 {
			ifd, err = index.RootIfd.ChildWithIfdPath(field.ifdPath)
			if err != nil {
				continue
			}
		} else {
			ifd = index.RootIfd
		}

		results, err := ifd.FindTagWithName(field.fieldName)
		if err != nil || len(results) == 0 {
			continue
		}

		dateTimeTag := results[0]
		dateTimeValue, err := dateTimeTag.Value()
		if err != nil {
			continue
		}

		dateStr, ok := dateTimeValue.(string)
		if !ok {
			continue
		}

		// For date-time fields in standard format
		if field.isDateTime {
			t, err := time.Parse("2006:01:02 15:04:05", dateStr)
			if err == nil {
				return t, nil
			}
		}
	}

	return time.Time{}, fmt.Errorf("couldn't find any valid date fields")
}
