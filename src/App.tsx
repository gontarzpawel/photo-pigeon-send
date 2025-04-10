
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Registration from "./pages/Registration";
import UploadDashboard from "./pages/UploadDashboard";
import HostingPlans from "./pages/HostingPlans";
import NotFound from "./pages/NotFound";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCanceled from "./pages/SubscriptionCanceled";
import NotificationCenter from "./components/NotificationCenter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="fixed top-4 right-4 z-50">
          <NotificationCenter />
        </div>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/dashboard" element={<UploadDashboard />} />
          <Route path="/hosting" element={<HostingPlans />} />
          <Route path="/subscription-success" element={<SubscriptionSuccess />} />
          <Route path="/subscription-canceled" element={<SubscriptionCanceled />} />
          <Route path="/payment-success" element={<Index />} />
          <Route path="/payment-canceled" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
