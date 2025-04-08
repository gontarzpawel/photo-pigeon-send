
import {useState} from "react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {authService} from "@/services/authService";
import {toast} from "sonner";

interface LoginFormProps {
    serverUrl: string;
    onServerUrlChange: (url: string) => void;
    loginApiPath?: string;
    onLoginSuccess: () => void;
    showRegisterLink?: boolean;
    onRegisterClick?: () => void;
}

const LoginForm = ({
    serverUrl,
    onServerUrlChange,
    loginApiPath = "login",
    onLoginSuccess,
    showRegisterLink = false,
    onRegisterClick
}: LoginFormProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error("Please enter both username and password");
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
            const success = await authService.login(username, password, serverUrl, loginApiPath);

            if (success) {
                // Identify user in Hotjar if it exists
                if (window.hj && typeof window.hj === 'function') {
                    const userInfo = authService.getCurrentUser();
                    const userRole = userInfo?.role || 'default';
                    window.hj('identify', username, {'role': userRole, 'username': username});
                    console.log('User identified in Hotjar with role:', userRole);
                }
                
                // Identify user in LogRocket if it exists
                if (window.LogRocket && typeof window.LogRocket.identify === 'function') {
                    const userInfo = authService.getCurrentUser();
                    window.LogRocket.identify(username, {
                        name: username,
                        role: userInfo?.role || 'default',
                        email: userInfo?.email || ''
                    });
                    console.log('User identified in LogRocket');
                }
                
                toast.success("Login successful");
                onLoginSuccess();
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl">Login Required</CardTitle>
                <CardDescription>
                    Authentication is required to upload photos
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
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
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        {isLoading ? "Logging in..." : "Login"}
                    </Button>
                    
                    {showRegisterLink && (
                        <div className="w-full text-center">
                            <span className="text-sm text-muted-foreground">
                                Don't have an account? {" "}
                                <Button 
                                    variant="link" 
                                    className="p-0 h-auto" 
                                    onClick={onRegisterClick}
                                >
                                    Register
                                </Button>
                            </span>
                        </div>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
};

export default LoginForm;
