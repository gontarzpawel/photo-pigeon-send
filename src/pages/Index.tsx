
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import UploadQueue from "@/components/UploadQueue";
import GalleryPicker from "@/components/gallery-picker";
import { photoQueue } from "@/services/photoService";
import { authService } from "@/services/authService";
import LoginForm from "@/components/LoginForm";
import { toast } from "sonner";
import Cart from "@/components/Cart";
import HostingPlans from "@/components/HostingPlans";

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
  const { toast: uiToast } = useToast();

  // Check auth status on load
  useEffect(() => {
    setIsAuthenticated(authService.isLoggedIn());
    
    // If user is already logged in, retrieve the server URL from storage
    if (authService.isLoggedIn()) {
      const savedUrl = authService.getBaseUrl();
      if (savedUrl) {
        setServerUrl(savedUrl);
      }
    }
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

  // Subscribe to queue status changes to provide consolidated feedback
  useEffect(() => {
    const handleQueueChange = (queue: any[]) => {
      // Group uploads by status for consolidated notifications
      const completedItems = queue.filter(item => item.status === 'completed' && !item._notified);
      const failedItems = queue.filter(item => item.status === 'failed' && !item._notified);
      
      // Show consolidated success notification if needed
      if (completedItems.length > 0) {
        if (completedItems.length === 1) {
          uiToast({
            title: "Upload successful",
            description: `${completedItems[0].file.name} has been uploaded.`,
          });
        } else {
          uiToast({
            title: "Uploads successful",
            description: `${completedItems.length} photos have been uploaded.`,
          });
        }
        
        // Mark items as notified
        completedItems.forEach(item => { item._notified = true; });
      }
      
      // Show consolidated failure notification if needed
      if (failedItems.length > 0) {
        if (failedItems.length === 1) {
          uiToast({
            title: "Upload failed",
            description: failedItems[0].error || "There was an error uploading the file.",
            variant: "destructive",
          });
        } else {
          uiToast({
            title: "Multiple uploads failed",
            description: `${failedItems.length} photos failed to upload.`,
            variant: "destructive",
          });
        }
        
        // Mark items as notified
        failedItems.forEach(item => { item._notified = true; });
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
  };

  // Handle login success
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    toast.info("You have been logged out");
  };

  // Handle server URL save
  const handleSaveServerUrl = () => {
    if (!urlError && serverUrl) {
      authService.saveBaseUrl(serverUrl);
      toast.success("Server URL saved");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!isAuthenticated ? (
        // Login form when not authenticated
        <div className="max-w-md mx-auto">
          <LoginForm 
            serverUrl={serverUrl}
            onServerUrlChange={setServerUrl}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      ) : (
        // Content when authenticated
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Photo Pigeon</h1>
            <div className="flex items-center gap-3">
              <Cart />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-[300px_1fr] gap-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Server Settings</CardTitle>
                <CardDescription>Configure your photo upload server</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="server-url">Server URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="server-url"
                      placeholder="https://your-server.com/api"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      className={`mb-1 ${urlError ? 'border-red-500' : ''}`}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSaveServerUrl}
                      disabled={!!urlError || !serverUrl}
                    >
                      Save
                    </Button>
                  </div>
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
            
            <div>
              <HostingPlans />
            </div>
          </div>
          
          {/* Add the upload queue component (always visible) */}
          <div className="mt-6">
            <UploadQueue />
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
