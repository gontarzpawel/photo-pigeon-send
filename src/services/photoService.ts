
import { toast } from "sonner";
import { authService } from "./authService";

// Item in the upload queue
export interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  serverUrl: string;
  source: 'camera' | 'gallery';
  originalPath?: string;
  error?: string;
  _lastStatus?: string; // To track status changes
}

// For backward compatibility - alias QueueItem as QueuedPhoto
export type QueuedPhoto = QueueItem;

// Photo queue manager class
class PhotoQueueManager {
  private queue: QueueItem[] = [];
  private uploadedPaths: Set<string> = new Set();
  private isUploading = false;
  private onQueueChangeCallback: ((queue: QueueItem[]) => void) | null = null;

  // Check if a file is already in the uploaded set
  isFileUploaded(path: string): boolean {
    return this.uploadedPaths.has(path);
  }

  // Set callback for queue changes
  setOnQueueChange(callback: ((queue: QueueItem[]) => void) | null): void {
    this.onQueueChangeCallback = callback;
  }

  // Notify observers of queue changes
  private notifyQueueChange(): void {
    if (this.onQueueChangeCallback) {
      this.onQueueChangeCallback([...this.queue]);
    }
  }

  // Add a file to the upload queue
  addToQueue(
    file: File, 
    serverUrl: string, 
    source: 'camera' | 'gallery',
    originalPath?: string
  ): string {
    // Generate a unique ID
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Create queue item
    const queueItem: QueueItem = {
      id,
      file,
      status: 'pending',
      progress: 0,
      serverUrl,
      source,
      originalPath
    };
    
    // Add to queue
    this.queue.push(queueItem);
    this.notifyQueueChange();
    
    return id;
  }

  // Start uploading all files in the queue
  async startUploadAll(): Promise<void> {
    if (this.isUploading || this.queue.length === 0) return;
    
    this.isUploading = true;
    
    // Process the queue sequentially
    while (this.queue.length > 0) {
      const item = this.queue[0];
      if (item.status === 'pending') {
        await this.uploadItem(item);
      } else if (item.status === 'completed' || item.status === 'failed') {
        // Remove completed or failed items from the queue
        this.removeFromQueue(item.id);
      } else {
        // Skip items that are currently uploading
        break;
      }
    }
    
    this.isUploading = false;
  }

  // Cancel an upload
  cancelUpload(id: string): void {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.notifyQueueChange();
    }
  }

  // Remove an item from the queue
  removeFromQueue(id: string): void {
    this.queue = this.queue.filter(item => item.id !== id);
    this.notifyQueueChange();
  }

  // Get the current queue
  getQueue(): QueueItem[] {
    return [...this.queue];
  }

  // Clear completed uploads from the queue
  clearCompleted(): void {
    this.queue = this.queue.filter(item => item.status !== 'completed' && item.status !== 'failed');
    this.notifyQueueChange();
  }

  // Upload a single item
  private async uploadItem(item: QueueItem): Promise<void> {
    // Update status to uploading
    item.status = 'uploading';
    this.notifyQueueChange();
    
    try {
      // Ensure we have a server URL that ends with /upload
      let uploadUrl = item.serverUrl;
      if (!uploadUrl.endsWith('/upload')) {
        uploadUrl = uploadUrl.endsWith('/') 
          ? `${uploadUrl}upload` 
          : `${uploadUrl}/upload`;
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('image', item.file);
      
      // Check if user is authenticated
      if (!authService.isLoggedIn()) {
        throw new Error('Authentication required. Please login first.');
      }
      
      // Get auth header
      const authHeader = authService.getAuthHeader();
      
      // Upload the file
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...authHeader,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Upload failed');
      }
      
      const data = await response.json();
      
      // If we have an originalPath, add it to the uploaded set
      if (item.originalPath) {
        this.uploadedPaths.add(item.originalPath);
      }
      
      // Update status to completed
      item.status = 'completed';
      item.progress = 100;
      this.notifyQueueChange();
      
      // Show success toast
      toast.success(`Uploaded ${item.file.name} successfully`);
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update status to failed
      item.status = 'failed';
      item.error = error instanceof Error ? error.message : 'Unknown error';
      this.notifyQueueChange();
      
      // Show error toast
      toast.error(item.error);
    }
  }
}

// Export a singleton instance
export const photoQueue = new PhotoQueueManager();
