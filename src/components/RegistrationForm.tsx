
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { toast } from "sonner";

interface RegistrationFormProps {
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  registerApiPath?: string;
  onRegistrationSuccess: () => void;
  onLoginClick: () => void;
}

const RegistrationForm = ({
  serverUrl,
  onServerUrlChange,
  registerApiPath = "register",
  onRegistrationSuccess,
  onLoginClick,
}: RegistrationFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Function to validate URL
  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  // Validate URL when it changes
  const handleServerUrlChange = (value: string) => {
    onServerUrlChange(value);

    if (value) {
      if (!isValidUrl(value)) {
        setUrlError("Please enter a valid URL starting with http:// or https://");
      } else {
        setUrlError(null);
      }
    } else {
      setUrlError(null); // No error when field is empty
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password || !email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (!serverUrl) {
      toast.error("Server URL is required");
      return;
    }

    if (urlError) {
      toast.error("Please enter a valid server URL");
      return;
    }

    setIsLoading(true);

    try {
      // Add debug logging to track the process
      console.log(`Attempting to register user at ${serverUrl}/register`);
      
      const success = await authService.register(username, password, email, serverUrl, registerApiPath);
      console.log("Registration result:", success);

      if (success) {
        toast.success("Registration successful");
        onRegistrationSuccess();
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Create an Account</CardTitle>
        <CardDescription>
          Register to use our photo storage service
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-url">Server URL</Label>
            <Input
              id="server-url"
              type="text"
              placeholder="https://your-server.com"
              value={serverUrl}
              onChange={(e) => handleServerUrlChange(e.target.value)}
              disabled={isLoading}
              className={urlError ? "border-red-500" : ""}
            />
            {urlError && (
              <p className="text-xs text-red-500 mt-1">{urlError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !!urlError}
          >
            {isLoading ? "Registering..." : "Register"}
          </Button>
          
          <div className="w-full text-center">
            <span className="text-sm text-muted-foreground">
              Already have an account? {" "}
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={onLoginClick}
              >
                Login
              </Button>
            </span>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RegistrationForm;
