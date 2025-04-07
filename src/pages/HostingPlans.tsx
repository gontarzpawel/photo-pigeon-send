
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import Cart from "@/components/Cart";
import HostingPlansComponent from "@/components/HostingPlans";

const HostingPlans = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // Check auth status on load
  useEffect(() => {
    setIsAuthenticated(authService.isLoggedIn());
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Photo Pigeon</h1>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
              <Cart />
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
            >
              Login
            </Button>
          )}
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <HostingPlansComponent />
      </div>
    </div>
  );
};

export default HostingPlans;
