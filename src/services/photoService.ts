
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
}

// Singleton class to manage photo upload queue
class PhotoQueueManager {
  private queue: QueuedPhoto[] = [];
  private isUploading = false;
  private onQueueChange: ((queue: QueuedPhoto[]) => void) | null = null;
  
  // Add a photo to the upload queue
  addToQueue(file: File, serverUrl: string): QueuedPhoto {
    const queueItem: QueuedPhoto = {
      id: crypto.randomUUID ? crypto.randomUUID() : `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      serverUrl,
      status: 'pending',
      progress: 0,
      timestamp: Date.now()
    };
    
    this.queue.push(queueItem);
    this.notifyQueueChange();
    
    // Start processing queue if not already running
    if (!this.isUploading) {
      this.processQueue();
    }
    
    return queueItem;
  }
  
  // Remove a photo from the queue
  removeFromQueue(id: string): void {
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
  setOnQueueChange(callback: (queue: QueuedPhoto[]) => void): void {
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
  
  // Notify observers of queue changes
  private notifyQueueChange(): void {
    if (this.onQueueChange) {
      this.onQueueChange([...this.queue]);
    }
  }
}

// Export singleton instance
export const photoQueue = new PhotoQueueManager();
