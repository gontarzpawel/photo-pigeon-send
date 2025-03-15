
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { photoQueue } from "@/services/photoService";
import { isValidUrl, isMobile, isIOS, requestPhotosAccess } from "./utils";

export const usePhotoProcessing = (
  serverUrl: string, 
  onPhotosSelected: (count: number) => void,
  onServerUrlChange: (url: string) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoScanLoading, setIsAutoScanLoading] = useState(false);
  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
  const { toast } = useToast();

  // Reset loading states when unmounting
  const resetLoadingStates = () => {
    setIsLoading(false);
    setIsAutoScanLoading(false);
  };

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

  // Process the selected files
  const processSelectedFiles = (files: File[]) => {
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
  };

  // Auto-detect new photos on device (iOS/mobile specific)
  const autoDetectNewPhotos = async (): Promise<void> => {
    try {
      // Request photo library access first
      const hasAccess = await requestPhotosAccess();
      
      if (!hasAccess) {
        toast({
          title: "Permission denied",
          description: "Unable to access your photos. Please grant permission in your settings.",
          variant: "destructive",
        });
        return;
      }
      
      // For iOS/mobile, we'll use the most permissive file input possible
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      
      // This will allow selection from the most recent photos
      // Unfortunately, due to browser security, we can't programmatically select files
      // The user will still need to tap to confirm the selection
      
      // Set up the onchange handler
      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const files = Array.from(target.files);
          processSelectedFiles(files);
        }
      };
      
      // Programmatically trigger the file picker
      input.click();
    } catch (error) {
      console.error("Error auto-detecting photos:", error);
      toast({
        title: "Auto-detect failed",
        description: "We couldn't automatically detect your photos. Please try manual selection.",
        variant: "destructive",
      });
    }
  };

  // Handle local server URL changes
  const handleServerUrlChange = (url: string) => {
    setLocalServerUrl(url);
    onServerUrlChange(url);
  };

  // Configure file input for best mobile experience
  const configureFileInput = (fileInput: HTMLInputElement, isMultiple: boolean = true) => {
    // Always ensure multiple selection is enabled if requested
    fileInput.multiple = isMultiple;
    
    // Configure for best mobile experience
    if (isMobile()) {
      // Remove any capture attribute to access full photo library
      fileInput.removeAttribute('capture');
      
      // iOS specific optimization
      if (isIOS()) {
        fileInput.accept = 'image/*';
      }
    }
  };

  return {
    isLoading,
    setIsLoading,
    isAutoScanLoading,
    setIsAutoScanLoading,
    localServerUrl,
    validateServerUrl,
    processSelectedFiles,
    autoDetectNewPhotos,
    handleServerUrlChange,
    configureFileInput,
    resetLoadingStates
  };
};
