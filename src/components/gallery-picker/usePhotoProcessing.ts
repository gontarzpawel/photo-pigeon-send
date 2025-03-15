
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { photoQueue } from "@/services/photoService";
import { isValidUrl, isMobile, isIOS } from "./utils";

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
    handleServerUrlChange,
    configureFileInput,
    resetLoadingStates
  };
};
