
FROM golang:1.20-alpine

WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod ./

# Download dependencies
RUN go mod download && go mod tidy

# Copy the source code
COPY . .

# Build the application
RUN go build -o image-server

# Set the entry point
CMD ["./image-server"]

EXPOSE 3001
