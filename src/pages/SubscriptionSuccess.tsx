
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Show success toast when the component mounts
    toast.success("Subscription activated successfully!");
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="max-w-md w-full text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold">Subscription Activated!</h1>
        
        <div className="py-4 space-y-2">
          <p className="text-muted-foreground">
            Thank you for subscribing to our cloud hosting service.
          </p>
          <p className="text-muted-foreground">
            Your photo storage plan is now active and ready to use.
          </p>
        </div>
        
        <div className="pt-6 space-y-4">
          <Button 
            onClick={() => navigate("/dashboard")} 
            size="lg" 
            className="w-full"
          >
            Go to Dashboard
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

export default SubscriptionSuccess;
