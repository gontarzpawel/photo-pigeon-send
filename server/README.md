
# Image Upload Server (Go Version)

A backend server written in Go that handles image uploads, extracts image metadata, organizes files by capture date, and prevents duplicate uploads.

## Features

- Image upload endpoint at `/upload`
- Extracts date metadata from image EXIF data
- Organizes images in folders by date (YYYY/MM/DD)
- Prevents duplicate uploads using file hashing
- CORS enabled for cross-origin requests

## Setup

### Using Go directly

1. Install Go (version 1.18 or later recommended)
2. Install dependencies:
   ```
   go mod download
   ```

3. Run the server:
   ```
   go run main.go
   ```

### Using Docker

1. Build the Docker image:
   ```
   docker build -t image-upload-server .
   ```

2. Run the container:
   ```
   docker run -p 3001:3001 -v $(pwd)/uploads:/app/uploads image-upload-server
   ```

The server will run on port 3001 by default.

## API Endpoints

### POST /upload

Upload an image file.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: Form data with an "image" field containing the image file

**Responses:**
- 201 Created: Image uploaded successfully
  ```json
  {
    "success": true, 
    "message": "Image uploaded successfully",
    "path": "/2023/04/15/1681568943783-a1b2c3d4.jpg",
    "date": "2023-04-15T12:34:56.000Z"
  }
  ```

- 400 Bad Request: No image provided
  ```json
  {
    "error": "No image file provided"
  }
  ```

- 409 Conflict: Duplicate image
  ```json
  {
    "error": "Image already uploaded",
    "message": "This exact image has already been uploaded previously.",
    "path": "/path/to/existing/image.jpg"
  }
  ```

- 500 Internal Server Error: Server-side error
  ```json
  {
    "error": "Server error",
    "message": "Error details"
  }
  ```

## File Storage

Files are stored in the `uploads` directory, organized by date:
```
uploads/
  └── 2023/
      └── 04/
          └── 15/
              └── 1681568943783-a1b2c3d4.jpg
```

Each filename includes a timestamp and a hash prefix to ensure uniqueness.
