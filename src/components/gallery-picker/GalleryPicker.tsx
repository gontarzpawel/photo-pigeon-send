
import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import GalleryButtons from "./GalleryButtons";
import GalleryInputs from "./GalleryInputs";
import LoginForm from "../LoginForm";
import { useFileSelection } from "./useFileSelection";
import { GalleryPickerProps } from "./types";
import { Button } from "@/components/ui/button";
import { isIOS } from "./utils";

const GalleryPicker = ({ serverUrl, onPhotosSelected }: GalleryPickerProps) => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
  
  // Check if the user is authenticated
  const isAuthenticated = authService.isLoggedIn();
  
  // Handle server URL changes
  const handleServerUrlChange = (url: string) => {
    setLocalServerUrl(url);
  };

  const {
    isLoading,
    isAutoScanLoading,
    handleFileChange,
    handleDirectorySelect,
    handleScanGallery,
    handleAutoScanAndUpload,
    handleAutoDetectAndUpload,
    handleChooseDirectoryAndUpload,
    resetLoadingStates
  } = useFileSelection(
    serverUrl, 
    onPhotosSelected, 
    setShowLoginForm,
    handleServerUrlChange
  );

  // Reset loading states when unmounting
  useEffect(() => {
    return resetLoadingStates;
  }, []);

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
      
      {isIOS() && (
        <Button 
          variant="outline" 
          onClick={handleAutoDetectAndUpload}
          disabled={isLoading || isAutoScanLoading}
          className="w-full"
        >
          {isAutoScanLoading ? "Scanning..." : "Quick Upload Photos"}
        </Button>
      )}
      
      <GalleryInputs
        handleFileChange={handleFileChange}
        handleDirectorySelect={handleDirectorySelect}
      />
      
      <p className="text-xs text-gray-500 text-center">
        {isIOS() ? 
          "Use Quick Upload to easily select and upload new photos without manual selection." :
          "Select multiple photos to upload or use auto-detect to find and upload all new photos automatically."
        }
      </p>
    </div>
  );
};

export default GalleryPicker;
