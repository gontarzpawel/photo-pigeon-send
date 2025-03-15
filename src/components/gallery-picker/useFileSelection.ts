
import { usePhotoProcessing } from "./usePhotoProcessing";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { isIOS } from "./utils";

export const useFileSelection = (
  serverUrl: string,
  onPhotosSelected: (count: number) => void,
  setShowLoginForm: (show: boolean) => void,
  onServerUrlChangeCallback: (url: string) => void
) => {
  const {
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
  } = usePhotoProcessing(serverUrl, onPhotosSelected, onServerUrlChangeCallback);

  // Check authentication before proceeding
  const checkAuthBeforeProceeding = (): boolean => {
    if (!authService.isLoggedIn()) {
      setShowLoginForm(true);
      return false;
    }
    return true;
  };

  // Handle file selection from file input (multiple files)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) {
      e.target.value = '';
      setIsLoading(false); // Reset loading state when validation fails
      return;
    }
  
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      processSelectedFiles(files);
      
      // Reset input so the same files can be selected again
      e.target.value = '';
    } 
    
    // Always reset loading state after file selection (or cancellation)
    setIsLoading(false);
  };

  // Handler for directory selection
  const handleDirectorySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) {
      e.target.value = '';
      setIsAutoScanLoading(false); // Reset loading when validation fails
      return;
    }
    
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      processSelectedFiles(files);
      
      // Reset for future use
      e.target.value = '';
    }
    
    // Always reset loading state after directory selection (or cancellation)
    setIsAutoScanLoading(false);
  };

  // Scan gallery and find unsynced photos
  const handleScanGallery = async () => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) {
      setIsLoading(false); // Reset loading when validation fails
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Improved mobile selection experience
      const fileInput = document.getElementById('gallery-file-input') as HTMLInputElement;
      
      if (fileInput) {
        configureFileInput(fileInput, true);
        
        // Handle cancelled selections
        // Set a timeout to reset loading state in case user cancels selection
        const timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, 30000); // 30 seconds timeout as fallback
        
        // Ensure loading state is reset when file input dialog is closed
        fileInput.onchange = () => {
          clearTimeout(timeoutId);
          // handleFileChange will handle the loading state
        };
        
        fileInput.click();
      }
    } catch (error) {
      console.error('Error scanning gallery:', error);
      setIsLoading(false);
    }
  };

  // Automatically detect and upload all unsynced photos
  const handleAutoDetectAndUpload = async () => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) {
      setIsAutoScanLoading(false);
      return;
    }
    
    setIsAutoScanLoading(true);
    
    try {
      // Use our new auto-detection function
      await autoDetectNewPhotos();
      
      // Reset loading state after auto-detection completes or fails
      setIsAutoScanLoading(false);
    } catch (error) {
      console.error('Error auto-detecting photos:', error);
      setIsAutoScanLoading(false);
      
      toast.error('Failed to access photos. Please try manual selection.');
    }
  };

  // Automatically scan and upload all unsynced photos
  const handleAutoScanAndUpload = async () => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) {
      setIsAutoScanLoading(false); // Reset loading when validation fails
      return;
    }
    
    setIsAutoScanLoading(true);
    
    try {
      // For iOS devices, use the new auto-detection method
      if (isIOS()) {
        await handleAutoDetectAndUpload();
        return;
      }
      
      // Enhanced mobile photo selection for Auto Scan
      const fileInput = document.getElementById('gallery-auto-scan-input') as HTMLInputElement;
      
      if (fileInput) {
        configureFileInput(fileInput, true);
        
        // Handle cancelled selections
        // Set a timeout to reset loading state in case user cancels selection
        const timeoutId = setTimeout(() => {
          setIsAutoScanLoading(false);
        }, 30000); // 30 seconds timeout as fallback
        
        fileInput.onchange = (e) => {
          clearTimeout(timeoutId);
          if (e.target && (e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files!.length > 0) {
            const files = Array.from((e.target as HTMLInputElement).files!);
            processSelectedFiles(files);
          }
          setIsAutoScanLoading(false);
        };
        
        fileInput.click();
      }
    } catch (error) {
      console.error('Error auto-scanning gallery:', error);
      setIsAutoScanLoading(false);
    }
  };

  // Function to handle directory selection for auto scan
  const handleChooseDirectoryAndUpload = () => {
    if (!validateServerUrl() || !checkAuthBeforeProceeding()) {
      setIsAutoScanLoading(false); // Reset loading when validation fails
      return;
    }
    
    setIsAutoScanLoading(true);
    
    try {
      const directoryInput = document.getElementById('gallery-directory-input') as HTMLInputElement;
      if (directoryInput) {
        // Handle cancelled selections
        // Set a timeout to reset loading state in case user cancels selection
        const timeoutId = setTimeout(() => {
          setIsAutoScanLoading(false);
        }, 30000); // 30 seconds timeout as fallback
        
        directoryInput.onchange = (e) => {
          clearTimeout(timeoutId);
          if (e.target && (e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files!.length > 0) {
            const files = Array.from((e.target as HTMLInputElement).files!);
            processSelectedFiles(files);
          }
          setIsAutoScanLoading(false);
        };
        
        directoryInput.click();
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setIsAutoScanLoading(false);
    }
  };

  return {
    isLoading,
    isAutoScanLoading,
    localServerUrl,
    handleFileChange,
    handleDirectorySelect,
    handleScanGallery,
    handleAutoScanAndUpload,
    handleAutoDetectAndUpload,
    handleChooseDirectoryAndUpload,
    handleServerUrlChange,
    resetLoadingStates
  };
};
