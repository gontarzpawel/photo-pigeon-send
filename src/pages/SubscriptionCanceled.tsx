
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const SubscriptionCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="max-w-md w-full text-center space-y-6">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
        <h1 className="text-3xl font-bold">Subscription Canceled</h1>
        
        <div className="py-4">
          <p className="text-muted-foreground">
            Your subscription process was canceled. You can try again whenever you're ready.
          </p>
        </div>
        
        <div className="pt-6 space-y-4">
          <Button 
            onClick={() => navigate("/hosting")} 
            size="lg" 
            className="w-full"
          >
            View Hosting Plans
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate("/")} 
            size="lg" 
            className="w-full"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCanceled;
