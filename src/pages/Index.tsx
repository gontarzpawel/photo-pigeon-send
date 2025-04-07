
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/LoginForm";
import { authService } from "@/services/authService";
import { toast } from "sonner";

const Index = () => {
  const [serverUrl, setServerUrl] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // Check auth status on load
  useEffect(() => {
    setIsAuthenticated(authService.isLoggedIn());
    
    // If user is already logged in, retrieve the server URL from storage
    if (authService.isLoggedIn()) {
      const savedUrl = authService.getBaseUrl();
      if (savedUrl) {
        setServerUrl(savedUrl);
      }
      // Redirect to dashboard if already logged in
      navigate('/dashboard');
    }
  }, [navigate]);

  // Handle login success
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6">Photo Pigeon</h1>
        <div className="max-w-md w-full">
          <LoginForm 
            serverUrl={serverUrl}
            onServerUrlChange={setServerUrl}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
        <div className="mt-8 text-center">
          <h2 className="text-xl font-medium mb-4">Need cloud storage for your photos?</h2>
          <p className="text-muted-foreground mb-4">
            Check out our hosting plans for secure and reliable photo storage
          </p>
          <Button onClick={() => navigate('/hosting')}>
            View Hosting Plans
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
