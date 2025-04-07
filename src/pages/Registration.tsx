
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "@/components/RegistrationForm";
import { authService } from "@/services/authService";

const Registration = () => {
  const [serverUrl, setServerUrl] = useState<string>("");
  const navigate = useNavigate();

  // Check auth status on load
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (authService.isLoggedIn()) {
      navigate('/dashboard');
      return;
    }
    
    // If not logged in but we have a saved server URL, use it
    const savedUrl = authService.getBaseUrl();
    if (savedUrl) {
      setServerUrl(savedUrl);
    }
  }, [navigate]);

  // Handle registration success
  const handleRegistrationSuccess = () => {
    navigate('/');
  };

  // Handle navigation to login page
  const handleLoginClick = () => {
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6">Photo Pigeon</h1>
        <div className="max-w-md w-full">
          <RegistrationForm 
            serverUrl={serverUrl}
            onServerUrlChange={setServerUrl}
            onRegistrationSuccess={handleRegistrationSuccess}
            onLoginClick={handleLoginClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Registration;
