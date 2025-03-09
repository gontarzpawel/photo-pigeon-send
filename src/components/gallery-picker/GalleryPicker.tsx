
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { photoQueue } from "@/services/photoService";
import { authService } from "@/services/authService";
import GalleryButtons from "./GalleryButtons";
import GalleryInputs from "./GalleryInputs";
import { GalleryPickerProps } from "./types";
import LoginForm from "../LoginForm";

// Function to validate URL
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const GalleryPicker = ({ serverUrl, onPhotosSelected }: GalleryPickerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoScanLoading, setIsAutoScanLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
  const { toast } = useToast();
  
  // Check if the user is authenticated
  const isAuthenticated = authService.isLoggedIn();

  // Validate server URL before proceeding
  const validateServerUrl = (): boolean => {
    if (!localServerUrl) {
      toast({
        title: "Server URL required",
        description: "Please enter the URL of the server to send images to.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!isValidUrl(localServerUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Check authentication before proceeding
  const checkAuthBeforeProceeding = (): boolean => {
    if (!isAuthenticated) {
      setShowLoginForm(true);
      return false;
    }
    return true;
  };

  // Handle file selection from file input (multiple files)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) {
      e.target.value = '';
      return;
    }
  
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      let addedCount = 0;
      
      files.forEach(file => {
        // For web, use the file object URL as the "originalPath"
        const filePath = URL.createObjectURL(file);
        
        // Check if already uploaded and add to queue if not
        if (!photoQueue.isFileUploaded(filePath)) {
          photoQueue.addToQueue(file, localServerUrl, 'gallery', filePath);
          addedCount++;
        }
      });
      
      if (addedCount > 0) {
        toast({
          title: `Added ${addedCount} photos to queue`,
          description: `${files.length - addedCount} photos were already uploaded.`,
        });
        onPhotosSelected(addedCount);
        
        // Start uploading automatically after adding photos
        photoQueue.startUploadAll();
      } else if (files.length > 0) {
        toast({
          title: "No new photos added",
          description: "All selected photos were already uploaded.",
          variant: "destructive",
        });
      }
      
      // Reset input so the same files can be selected again
      e.target.value = '';
    }
  };

  // Handle local server URL changes
  const handleServerUrlChange = (url: string) => {
    setLocalServerUrl(url);
  };

  // Scan gallery and find unsynced photos
  const handleScanGallery = async () => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) return;
    
    setIsLoading(true);
    
    try {
      // In a real mobile app, this would access the native gallery
      // For now, we'll simulate it by opening the file picker
      document.getElementById('gallery-file-input')?.click();
    } catch (error) {
      console.error('Error scanning gallery:', error);
      toast({
        title: "Error scanning gallery",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for directory selection
  const handleDirectorySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) {
      e.target.value = '';
      return;
    }
    
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      let addedCount = 0;
      
      files.forEach(file => {
        const filePath = URL.createObjectURL(file);
        
        if (!photoQueue.isFileUploaded(filePath)) {
          photoQueue.addToQueue(file, localServerUrl, 'gallery', filePath);
          addedCount++;
        }
      });
      
      // Provide feedback to user
      if (addedCount > 0) {
        toast({
          title: `Auto-detected ${addedCount} new photos from directory`,
          description: "Starting upload automatically...",
        });
        onPhotosSelected(addedCount);
        
        // Start uploading automatically
        photoQueue.startUploadAll();
      } else {
        toast({
          title: "No new photos found in directory",
          description: "All photos are already uploaded.",
        });
      }
      
      // Reset for future use
      e.target.value = '';
      setIsAutoScanLoading(false);
    }
  };

  // Automatically scan and upload all unsynced photos
  const handleAutoScanAndUpload = async () => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) return;
    
    setIsAutoScanLoading(true);
    
    try {
      // In a mobile app, this would directly access media library
      // In web, we'll simulate by triggering the file picker
      const fileInput = document.getElementById('gallery-auto-scan-input') as HTMLInputElement;
      fileInput?.click();
      
      // Add listener for when files are selected
      fileInput.onchange = (e) => {
        if (e.target && (e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files!.length > 0) {
          const files = Array.from((e.target as HTMLInputElement).files!);
          let addedCount = 0;
          
          files.forEach(file => {
            const filePath = URL.createObjectURL(file);
            
            if (!photoQueue.isFileUploaded(filePath)) {
              photoQueue.addToQueue(file, localServerUrl, 'gallery', filePath);
              addedCount++;
            }
          });
          
          // Provide feedback to user
          if (addedCount > 0) {
            toast({
              title: `Auto-detected ${addedCount} new photos`,
              description: "Starting upload automatically...",
            });
            onPhotosSelected(addedCount);
            
            // Start uploading automatically
            photoQueue.startUploadAll();
          } else {
            toast({
              title: "No new photos found",
              description: "All photos are already uploaded.",
            });
          }
          
          // Reset for future use
          fileInput.value = '';
          setIsAutoScanLoading(false);
        }
      };
      
    } catch (error) {
      console.error('Error auto-scanning gallery:', error);
      toast({
        title: "Error auto-scanning gallery",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setIsAutoScanLoading(false);
    }
  };

  // Function to handle directory selection for auto scan
  const handleChooseDirectoryAndUpload = () => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) return;
    
    setIsAutoScanLoading(true);
    
    try {
      // In a real mobile app, this would access specific directories
      // For web, we use webkitdirectory attribute on input
      const directoryInput = document.getElementById('gallery-directory-input') as HTMLInputElement;
      directoryInput?.click();
    } catch (error) {
      console.error('Error selecting directory:', error);
      toast({
        title: "Error selecting directory",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setIsAutoScanLoading(false);
    }
  };

  // Handle login success
  const handleLoginSuccess = () => {
    setShowLoginForm(false);
  };

  if (showLoginForm) {
    return (
      <LoginForm 
        serverUrl={localServerUrl}
        onServerUrlChange={handleServerUrlChange}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="space-y-4">
      <GalleryButtons 
        isLoading={isLoading}
        isAutoScanLoading={isAutoScanLoading}
        onScanGallery={handleScanGallery}
        onAutoScanAndUpload={handleAutoScanAndUpload}
        onChooseDirectoryAndUpload={handleChooseDirectoryAndUpload}
      />
      
      <GalleryInputs
        handleFileChange={handleFileChange}
        handleDirectorySelect={handleDirectorySelect}
      />
      
      <p className="text-xs text-gray-500 text-center">
        Select multiple photos to upload or use auto-detect to find and upload all new photos automatically.
      </p>
    </div>
  );
};

export default GalleryPicker;
