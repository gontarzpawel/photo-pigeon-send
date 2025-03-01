
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { photoQueue } from "@/services/photoService";
import { useToast } from "./ui/use-toast";

interface GalleryPickerProps {
  serverUrl: string;
  onPhotosSelected: (count: number) => void;
}

const GalleryPicker = ({ serverUrl, onPhotosSelected }: GalleryPickerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handle file selection from file input (multiple files)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      let addedCount = 0;
      
      files.forEach(file => {
        // For web, use the file object URL as the "originalPath"
        const filePath = URL.createObjectURL(file);
        
        // Check if already uploaded and add to queue if not
        if (!photoQueue.isFileUploaded(filePath)) {
          photoQueue.addToQueue(file, serverUrl, 'gallery', filePath);
          addedCount++;
        }
      });
      
      if (addedCount > 0) {
        toast({
          title: `Added ${addedCount} photos to queue`,
          description: `${files.length - addedCount} photos were already uploaded.`,
        });
        onPhotosSelected(addedCount);
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

  // Scan gallery and find unsynced photos (this would use native APIs in a real mobile app)
  const handleScanGallery = async () => {
    setIsLoading(true);
    
    try {
      // In a real mobile app, this would access the native gallery
      // For now, we'll simulate it by opening the file picker
      document.getElementById('gallery-file-input')?.click();
      
      /* This would be the mobile implementation:
      const unsyncedPhotos = await photoQueue.getUnsyncedGalleryPhotos(serverUrl);
      
      if (unsyncedPhotos.length > 0) {
        toast({
          title: `Found ${unsyncedPhotos.length} new photos`,
          description: "Added to upload queue.",
        });
        onPhotosSelected(unsyncedPhotos.length);
      } else {
        toast({
          title: "No new photos found",
          description: "All photos have already been uploaded.",
        });
      }
      */
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

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleScanGallery} 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Scanning..." : "Select Photos from Gallery"}
      </Button>
      
      <Input 
        id="gallery-file-input" 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden"
        multiple
      />
      
      <p className="text-xs text-gray-500 text-center">
        Select multiple photos to upload. Only new photos will be added to the queue.
      </p>
    </div>
  );
};

export default GalleryPicker;
