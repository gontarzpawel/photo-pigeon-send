
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import CameraCapture from "@/components/CameraCapture";
import ImagePreview from "@/components/ImagePreview";
import UploadQueue from "@/components/UploadQueue";
import GalleryPicker from "@/components/gallery-picker";
import { photoQueue } from "@/services/photoService";

// Function to validate URL
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const { toast } = useToast();

  // Validate URL when it changes
  useEffect(() => {
    if (serverUrl) {
      if (!isValidUrl(serverUrl)) {
        setUrlError("Please enter a valid URL starting with http:// or https://");
      } else {
        setUrlError(null);
      }
    } else {
      setUrlError(null); // No error when field is empty
    }
  }, [serverUrl]);

  // Subscribe to queue status changes to provide feedback
  useEffect(() => {
    const handleQueueChange = (queue: any[]) => {
      const latestItem = queue[0];
      
      // Provide toast notifications for status changes
      if (latestItem && latestItem._lastStatus !== latestItem.status) {
        if (latestItem.status === 'completed') {
          toast({
            title: "Upload successful",
            description: `${latestItem.file.name} has been uploaded successfully.`,
          });
        } else if (latestItem.status === 'failed') {
          toast({
            title: "Upload failed",
            description: latestItem.error || "There was an error uploading the file.",
            variant: "destructive",
          });
        }
        
        // Store last status to prevent duplicate notifications
        latestItem._lastStatus = latestItem.status;
      }
    };
    
    photoQueue.setOnQueueChange(handleQueueChange);
    
    return () => {
      photoQueue.setOnQueueChange(null);
    };
  }, [toast]);

  // Handle file selection from file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  // Handle image captured from camera
  const handleCameraCapture = (imageBlobUrl: string, imageBlob: Blob) => {
    setPreviewUrl(imageBlobUrl);
    setSelectedImage(new File([imageBlob], "camera-capture.jpg", { type: "image/jpeg" }));
  };

  // Reset the selection and preview
  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  // Handle photos selected from gallery
  const handleGalleryPhotosSelected = (count: number) => {
    // No need to update UI here as photos go directly to queue
    // But we could show a notification or update some counter
  };

  // Add the photo to the upload queue
  const handleSend = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please select or capture an image first.",
        variant: "destructive",
      });
      return;
    }

    if (!serverUrl) {
      toast({
        title: "Server URL required",
        description: "Please enter the URL of the server to send the image to.",
        variant: "destructive",
      });
      return;
    }

    if (urlError) {
      toast({
        title: "Invalid URL",
        description: urlError,
        variant: "destructive",
      });
      return;
    }

    // Add to queue instead of uploading immediately
    photoQueue.addToQueue(selectedImage, serverUrl, 'camera');
    
    toast({
      title: "Photo added to queue",
      description: "Your photo has been added to the upload queue.",
    });
    
    handleReset();
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Photo Pigeon</CardTitle>
          <CardDescription>Capture and send photos to your server</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="server-url">Server URL</Label>
            <Input
              id="server-url"
              placeholder="https://your-server.com/api/upload"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className={`mb-1 ${urlError ? 'border-red-500' : ''}`}
            />
            {urlError && (
              <p className="text-xs text-red-500 mt-1">{urlError}</p>
            )}
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="camera">Camera</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4">
              <div className="flex flex-col items-center justify-center">
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <p className="text-sm text-gray-500">
                      Click to select a photo, or drag and drop
                    </p>
                  </div>
                </Label>
                <Input 
                  id="photo-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden"
                />
              </div>
            </TabsContent>
            <TabsContent value="camera">
              <CameraCapture onCapture={handleCameraCapture} />
            </TabsContent>
            <TabsContent value="gallery">
              <GalleryPicker 
                serverUrl={serverUrl} 
                onPhotosSelected={handleGalleryPhotosSelected} 
              />
            </TabsContent>
          </Tabs>

          {previewUrl && (
            <div className="mt-4">
              <ImagePreview imageUrl={previewUrl} />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={!selectedImage || isUploading}
          >
            Reset
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!selectedImage || isUploading || (serverUrl && !!urlError)}
          >
            Add to Queue
          </Button>
        </CardFooter>
      </Card>
      
      {/* Add the upload queue component */}
      <UploadQueue />
    </div>
  );
};

export default Index;
