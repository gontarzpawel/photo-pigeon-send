
# Image Upload Server (Go Version)

A backend server written in Go that handles image uploads, extracts image metadata, organizes files by capture date, and prevents duplicate uploads. The server includes JWT-based authentication to ensure only authorized users can upload images.

## Features

- JWT-based authentication
- Image upload endpoint at `/upload` (protected)
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

## Configuration

The server uses the following environment variables:

- `JWT_SECRET`: Secret key for JWT token signing (default: "your-secret-key-change-in-production")

In production, you should always set the `JWT_SECRET` environment variable to a secure value:

```
export JWT_SECRET="your-secure-random-string"
go run main.go
```

Or with Docker:

```
docker run -p 3001:3001 -e JWT_SECRET="your-secure-random-string" -v $(pwd)/uploads:/app/uploads image-upload-server
```

## Default User

For testing purposes, the server includes a default user:
- Username: `admin`
- Password: `password123`

**IMPORTANT**: You should modify the default credentials in production by editing the `authUsers` map in `main.go`.

## API Endpoints

### POST /login

Authenticate a user and receive a JWT token.

**Request:**
- Method: POST
- Content-Type: application/json
- Body:
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```

**Responses:**
- 200 OK: Authentication successful
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

- 401 Unauthorized: Invalid credentials
  ```json
  {
    "error": "Invalid credentials"
  }
  ```

### POST /upload

Upload an image file (requires authentication).

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Headers:
  - Authorization: Bearer {token}
- Body: Form data with an "image" field containing the image file

**Responses:**
- 201 Created: Image uploaded successfully
  ```json
  {
    "success": true, 
    "message": "Image uploaded successfully",
    "path": "/2023/04/15/1681568943783-a1b2c3d4.jpg",
    "date": "2023-04-15T12:34:56.000Z",
    "uploader": "admin"
  }
  ```

- 400 Bad Request: No image provided
  ```json
  {
    "error": "No image file provided"
  }
  ```

- 401 Unauthorized: Missing or invalid token
  ```json
  {
    "error": "Authorization header is required"
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

## Running Tests

To run the tests:

```
go test -v
```

This will run all the unit tests for the server, including authentication and image upload functionality.
