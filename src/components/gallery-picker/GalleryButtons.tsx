
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
    <div className="flex flex-col space-y-3">
      <Button 
        onClick={onScanGallery} 
        className="w-full"
        disabled={isLoading || isAutoScanLoading}
      >
        {isLoading ? "Scanning..." : "Select Photos from Gallery"}
      </Button>
      
      <Button 
        onClick={onAutoScanAndUpload} 
        className="w-full"
        variant="secondary"
        disabled={isLoading || isAutoScanLoading}
      >
        {isAutoScanLoading ? "Auto-Scanning..." : "Auto-Detect & Upload New Photos"}
      </Button>
      
      <Button 
        onClick={onChooseDirectoryAndUpload} 
        className="w-full"
        variant="outline"
        disabled={isLoading || isAutoScanLoading}
      >
        {isAutoScanLoading ? "Scanning Directory..." : "Choose Directory & Upload"}
      </Button>
    </div>
  );
};

export default GalleryButtons;
