
/**
 * Uploads a photo to the specified server with progress tracking
 * @param file The image file to upload
 * @param serverUrl The URL of the server to send the image to
 * @param onProgress Callback function that receives upload progress (0-100)
 * @returns Promise that resolves when the upload is complete
 */
export const uploadPhoto = async (
  file: File, 
  serverUrl: string, 
  onProgress?: (progress: number) => void
): Promise<void> => {
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append('photo', file);
  
  try {
    // Use XMLHttpRequest for progress tracking instead of fetch
    const xhr = new XMLHttpRequest();
    
    // Create a promise that will resolve when the upload is complete
    const uploadPromise = new Promise<void>((resolve, reject) => {
      xhr.open('POST', serverUrl);
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          let errorMessage = `Upload failed with status: ${xhr.status}`;
          try {
            const errorData = JSON.parse(xhr.responseText);
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {
            // Ignore json parsing error, use default error message
          }
          reject(new Error(errorMessage));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error occurred during upload'));
      };
      
      xhr.onabort = () => {
        reject(new Error('Upload was aborted'));
      };
    });
    
    // Start the upload
    xhr.send(formData);
    
    // Wait for the upload to complete
    await uploadPromise;
    
    return;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

// Interface for unsent photo queue items
export interface QueuedPhoto {
  id: string;
  file: File;
  serverUrl: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  timestamp: number;
  source?: 'camera' | 'gallery' | 'file';
  originalPath?: string; // Used to track the original file path for mobile devices
  _lastStatus?: string; // Internal field to track last status for UI notifications
}

// Function to validate URL
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

// Singleton class to manage photo upload queue
class PhotoQueueManager {
  private queue: QueuedPhoto[] = [];
  private isUploading = false;
  private onQueueChange: ((queue: QueuedPhoto[]) => void) | null = null;
  private uploadedFiles: Set<string> = new Set(); // Track uploaded file paths
  
  constructor() {
    // Try to load previously uploaded files from localStorage
    try {
      const savedUploads = localStorage.getItem('uploadedFiles');
      if (savedUploads) {
        const parsedUploads = JSON.parse(savedUploads);
        this.uploadedFiles = new Set(parsedUploads);
      }
    } catch (error) {
      console.error('Error loading upload history:', error);
    }
  }
  
  // Check if a file has been uploaded before
  isFileUploaded(filePath: string): boolean {
    return this.uploadedFiles.has(filePath);
  }
  
  // Mark a file as uploaded
  markFileAsUploaded(filePath: string): void {
    this.uploadedFiles.add(filePath);
    this.saveUploadHistory();
  }
  
  // Save upload history to localStorage
  private saveUploadHistory(): void {
    try {
      localStorage.setItem('uploadedFiles', JSON.stringify([...this.uploadedFiles]));
    } catch (error) {
      console.error('Error saving upload history:', error);
    }
  }
  
  // Add a photo to the upload queue
  addToQueue(file: File, serverUrl: string, source?: 'camera' | 'gallery' | 'file', originalPath?: string): QueuedPhoto {
    // Validate the server URL
    if (!serverUrl || !isValidUrl(serverUrl)) {
      const errorItem: QueuedPhoto = {
        id: crypto.randomUUID ? crypto.randomUUID() : `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        serverUrl,
        status: 'failed',
        progress: 0,
        error: 'Invalid server URL',
        timestamp: Date.now(),
        source,
        originalPath
      };
      
      this.queue.unshift(errorItem);
      this.notifyQueueChange();
      
      return errorItem;
    }
    
    // If this file has already been uploaded (check by path if available), don't add it
    if (originalPath && this.isFileUploaded(originalPath)) {
      console.log(`File ${originalPath} already uploaded, skipping`);
      
      // Create a dummy item to indicate the file was skipped
      const skippedItem: QueuedPhoto = {
        id: crypto.randomUUID ? crypto.randomUUID() : `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        serverUrl,
        status: 'failed',
        progress: 0,
        error: 'File already uploaded',
        timestamp: Date.now(),
        source,
        originalPath
      };
      
      // Don't add to queue, but return for reference
      return skippedItem;
    }
    
    const queueItem: QueuedPhoto = {
      id: crypto.randomUUID ? crypto.randomUUID() : `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      serverUrl,
      status: 'pending',
      progress: 0,
      timestamp: Date.now(),
      source,
      originalPath
    };
    
    // Add at the beginning of the queue for better visibility
    this.queue.unshift(queueItem);
    this.notifyQueueChange();
    
    // Start processing queue if not already running
    if (!this.isUploading) {
      this.processQueue();
    }
    
    return queueItem;
  }
  
  // Remove a photo from the queue
  removeFromQueue(id: string): void {
    const itemToRemove = this.queue.find(item => item.id === id);
    if (itemToRemove && itemToRemove.status === 'uploading') {
      // In a real implementation, we would want to cancel the in-progress XHR
      // For now, just mark it as failed
      itemToRemove.status = 'failed';
      itemToRemove.error = 'Upload cancelled by user';
      this.notifyQueueChange();
    }
    
    this.queue = this.queue.filter(item => item.id !== id);
    this.notifyQueueChange();
  }
  
  // Clear all completed or failed uploads
  clearCompleted(): void {
    this.queue = this.queue.filter(item => 
      item.status !== 'completed' && item.status !== 'failed'
    );
    this.notifyQueueChange();
  }
  
  // Get current queue
  getQueue(): QueuedPhoto[] {
    return [...this.queue];
  }
  
  // Set callback for queue changes
  setOnQueueChange(callback: ((queue: QueuedPhoto[]) => void) | null): void {
    this.onQueueChange = callback;
  }
  
  // Process queue items one by one
  private async processQueue(): Promise<void> {
    if (this.isUploading || this.queue.length === 0) {
      return;
    }
    
    this.isUploading = true;
    
    // Find next pending item
    const nextItem = this.queue.find(item => item.status === 'pending');
    
    if (nextItem) {
      // Update status to uploading
      nextItem.status = 'uploading';
      this.notifyQueueChange();
      
      try {
        // Upload the photo with progress tracking
        await uploadPhoto(
          nextItem.file, 
          nextItem.serverUrl,
          (progress) => {
            nextItem.progress = progress;
            this.notifyQueueChange();
          }
        );
        
        // Update status to completed
        nextItem.status = 'completed';
        nextItem.progress = 100;
        
        // Mark file as uploaded if we have the original path
        if (nextItem.originalPath) {
          this.markFileAsUploaded(nextItem.originalPath);
        }
      } catch (error) {
        // Update status to failed
        nextItem.status = 'failed';
        nextItem.error = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to upload photo:', error);
      } finally {
        this.notifyQueueChange();
        this.isUploading = false;
        
        // Continue processing queue
        this.processQueue();
      }
    } else {
      this.isUploading = false;
    }
  }
  
  // Start uploading all pending items
  startUploadAll(): void {
    if (!this.isUploading) {
      this.processQueue();
    }
  }
  
  // Get gallery photos that haven't been uploaded
  async getUnsyncedGalleryPhotos(serverUrl: string): Promise<QueuedPhoto[]> {
    try {
      const newPhotos = await this.loadGalleryPhotos();
      
      // Filter out already uploaded photos and add new ones to the queue
      const unsyncedPhotos: QueuedPhoto[] = [];
      for (const photo of newPhotos) {
        if (!this.isFileUploaded(photo.originalPath!)) {
          const queueItem = this.addToQueue(photo.file, serverUrl, 'gallery', photo.originalPath);
          if (queueItem.id) { // Check if it's a valid queue item
            unsyncedPhotos.push(queueItem);
          }
        }
      }
      
      return unsyncedPhotos;
    } catch (error) {
      console.error('Error loading unsynced photos:', error);
      return [];
    }
  }
  
  // Load photos from the device gallery
  private async loadGalleryPhotos(): Promise<{file: File, originalPath: string}[]> {
    // For web/development environment, we'll just use a file input
    // In a real mobile app, we would use Capacitor's FilePicker or similar
    
    // This is a placeholder - in a real app we would use native APIs
    // For now, we'll return an empty array as we can't access the gallery without user interaction
    return [];
  }
  
  // Notify observers of queue changes
  private notifyQueueChange(): void {
    if (this.onQueueChange) {
      this.onQueueChange([...this.queue]);
    }
  }
}

// Export singleton instance
export const photoQueue = new PhotoQueueManager();
