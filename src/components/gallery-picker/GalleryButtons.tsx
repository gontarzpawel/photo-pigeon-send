
import { Button } from "@/components/ui/button";
import { GalleryButtonsProps } from "./types";

const GalleryButtons = ({ 
  isLoading, 
  isAutoScanLoading, 
  onScanGallery, 
  onAutoScanAndUpload, 
  onChooseDirectoryAndUpload 
}: GalleryButtonsProps) => {
  return (
    <>
      <Button 
        onClick={onScanGallery} 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Scanning..." : "Select Photos from Gallery"}
      </Button>
      
      <Button 
        onClick={onAutoScanAndUpload} 
        className="w-full"
        variant="secondary"
        disabled={isAutoScanLoading}
      >
        {isAutoScanLoading ? "Auto-Scanning..." : "Auto-Detect & Upload New Photos"}
      </Button>
      
      <Button 
        onClick={onChooseDirectoryAndUpload} 
        className="w-full"
        variant="outline"
        disabled={isAutoScanLoading}
      >
        {isAutoScanLoading ? "Scanning Directory..." : "Choose Directory & Upload"}
      </Button>
    </>
  );
};

export default GalleryButtons;
