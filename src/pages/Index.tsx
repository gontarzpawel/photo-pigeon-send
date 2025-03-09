
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import UploadQueue from "@/components/UploadQueue";
import GalleryPicker from "@/components/gallery-picker";
import { photoQueue } from "@/services/photoService";
import { authService } from "@/services/authService";
import LoginForm from "@/components/LoginForm";
import { toast } from "sonner";

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
  const [serverUrl, setServerUrl] = useState<string>("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const { toast: uiToast } = useToast();

  // Check auth status on load
  useEffect(() => {
    setIsAuthenticated(authService.isLoggedIn());
  }, []);

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
          uiToast({
            title: "Upload successful",
            description: `${latestItem.file.name} has been uploaded successfully.`,
          });
        } else if (latestItem.status === 'failed') {
          uiToast({
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
  }, [uiToast]);

  // Handle photos selected from gallery
  const handleGalleryPhotosSelected = (count: number) => {
    // No need to update UI here as photos go directly to queue
    // But we could show a notification or update some counter
  };

  // Handle login success
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginForm(false);
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    toast.info("You have been logged out");
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      {showLoginForm ? (
        <LoginForm 
          serverUrl={serverUrl} 
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Photo Pigeon</CardTitle>
            <CardDescription>Send photos to your server</CardDescription>
            {isAuthenticated && (
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="server-url">Server URL</Label>
              <Input
                id="server-url"
                placeholder="https://your-server.com/api"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className={`mb-1 ${urlError ? 'border-red-500' : ''}`}
              />
              {urlError && (
                <p className="text-xs text-red-500 mt-1">{urlError}</p>
              )}
            </div>

            <GalleryPicker 
              serverUrl={serverUrl} 
              onPhotosSelected={handleGalleryPhotosSelected} 
            />
          </CardContent>
        </Card>
      )}
      
      {/* Add the upload queue component */}
      <UploadQueue />
    </div>
  );
};

export default Index;
