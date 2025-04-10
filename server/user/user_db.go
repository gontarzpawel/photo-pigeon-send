package user

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	Username  string    `json:"username"`
	Password  string    `json:"password"` // Hashed password
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// UserDatabase represents an in-memory database of users with persistence
type UserDatabase struct {
	Users map[string]User `json:"users"`
	mu    sync.RWMutex    // For thread safety
	path  string          // Path to the JSON file for persistence
}

// NewUserDatabase creates a new user database
func NewUserDatabase(path string) (*UserDatabase, error) {
	db := &UserDatabase{
		Users: make(map[string]User),
		path:  path,
	}

	// Try to load existing users from file
	err := db.LoadFromDisk()
	if err != nil {
		// If the file doesn't exist, that's fine - we'll create it later
		if !os.IsNotExist(err) {
			return nil, fmt.Errorf("error loading user database: %w", err)
		}
	}

	return db, nil
}

// AddUser adds a new user to the database
func (db *UserDatabase) AddUser(username, password, email string) error {
	db.mu.Lock()
	defer db.mu.Unlock()

	// Check if user already exists
	if _, exists := db.Users[username]; exists {
		return fmt.Errorf("user %s already exists", username)
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("error hashing password: %w", err)
	}

	// Create the user
	db.Users[username] = User{
		Username:  username,
		Password:  string(hashedPassword),
		Email:     email,
		Role:      "user", // Default role
		CreatedAt: time.Now(),
	}

	// Save changes to disk
	return db.SaveToDisk()
}

// ValidateCredentials checks if the provided username and password are valid
func (db *UserDatabase) ValidateCredentials(username, password string) bool {
	db.mu.RLock()
	defer db.mu.RUnlock()

	user, exists := db.Users[username]
	if !exists {
		return false
	}

	// Compare the provided password with the stored hash
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	return err == nil
}

// GetUser returns a user by username
func (db *UserDatabase) GetUser(username string) (User, bool) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	user, exists := db.Users[username]
	return user, exists
}

// SaveToDisk saves the user database to a JSON file
func (db *UserDatabase) SaveToDisk() error {

	data, err := json.MarshalIndent(db, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling user database: %w", err)
	}

	err = ioutil.WriteFile(db.path, data, 0644)
	if err != nil {
		return fmt.Errorf("error writing user database to file: %w", err)
	}

	return nil
}

// LoadFromDisk loads the user database from a JSON file
func (db *UserDatabase) LoadFromDisk() error {
	data, err := ioutil.ReadFile(db.path)
	if err != nil {
		return err
	}

	// Create a temporary database to unmarshal into
	tempDB := &UserDatabase{}
	err = json.Unmarshal(data, tempDB)
	if err != nil {
		return fmt.Errorf("error unmarshaling user database: %w", err)
	}

	// Update the current database
	db.mu.Lock()
	db.Users = tempDB.Users
	db.mu.Unlock()

	return nil
}
