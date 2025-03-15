
import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import GalleryButtons from "./GalleryButtons";
import GalleryInputs from "./GalleryInputs";
import LoginForm from "../LoginForm";
import { useFileSelection } from "./useFileSelection";
import { GalleryPickerProps } from "./types";

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
