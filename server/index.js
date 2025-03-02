
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
const ExifParser = require('exif-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Store uploaded file hashes to prevent duplicates
const uploadedHashes = new Map();

// Load existing hashes from disk on startup
const loadExistingHashes = () => {
  try {
    // Walk through the uploads directory recursively
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          walkDir(filePath);
        } else {
          // Calculate hash of existing file
          const fileBuffer = fs.readFileSync(filePath);
          const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
          uploadedHashes.set(hash, filePath);
          console.log(`Loaded existing file hash: ${hash} for ${filePath}`);
        }
      });
    };
    
    walkDir(UPLOADS_DIR);
    console.log(`Loaded ${uploadedHashes.size} existing file hashes`);
  } catch (err) {
    console.error('Error loading existing hashes:', err);
  }
};

// Load hashes on startup
loadExistingHashes();

// Configure multer storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Extract date from image metadata
const getImageDate = (buffer) => {
  try {
    const parser = ExifParser.create(buffer);
    const result = parser.parse();
    
    if (result && result.tags && result.tags.DateTimeOriginal) {
      // Convert EXIF date to JS Date
      const timestamp = result.tags.DateTimeOriginal;
      const date = new Date(timestamp * 1000);
      return date;
    }
  } catch (err) {
    console.error('Error parsing EXIF data:', err);
  }
  
  // Default to current date if metadata extraction fails
  return new Date();
};

// Endpoint to upload an image
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Calculate file hash
    const fileBuffer = req.file.buffer;
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Check if file already exists
    if (uploadedHashes.has(hash)) {
      return res.status(409).json({ 
        error: 'Image already uploaded',
        message: 'This exact image has already been uploaded previously.',
        path: uploadedHashes.get(hash)
      });
    }
    
    // Extract date from image metadata
    const imageDate = getImageDate(fileBuffer);
    
    // Create directories based on date: YYYY/MM/DD
    const year = imageDate.getFullYear().toString();
    const month = (imageDate.getMonth() + 1).toString().padStart(2, '0');
    const day = imageDate.getDate().toString().padStart(2, '0');
    
    const dateDir = path.join(UPLOADS_DIR, year, month, day);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
    
    // Generate a unique filename
    const ext = path.extname(req.file.originalname).toLowerCase();
    const timestamp = Date.now();
    const filename = `${timestamp}-${hash.substring(0, 8)}${ext}`;
    const filePath = path.join(dateDir, filename);
    
    // Save file to disk
    fs.writeFileSync(filePath, fileBuffer);
    
    // Store hash to prevent duplicates
    uploadedHashes.set(hash, filePath);
    
    // Return success response
    res.status(201).json({ 
      success: true, 
      message: 'Image uploaded successfully',
      path: filePath.replace(UPLOADS_DIR, ''),
      date: imageDate
    });
    
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
