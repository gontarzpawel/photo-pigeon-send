
import { toast } from "sonner";

interface LoginResponse {
  token: string;
}

export interface User {
  username: string;
}

class AuthService {
  private tokenKey = "photo_pigeon_auth_token";
  private userKey = "photo_pigeon_user";
  private baseUrlKey = "photo_pigeon_base_url";
  private apiPathKey = "photo_pigeon_api_path";
  
  // Login the user and store the token
  async login(username: string, password: string, serverUrl: string, apiPath: string = "login"): Promise<boolean> {
    try {
      // Store the base URL for future use
      this.saveBaseUrl(serverUrl);
      
      // Construct the full login URL
      const loginUrl = this.buildApiUrl(serverUrl, apiPath);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data: LoginResponse = await response.json();
      
      // Store the token and user info
      localStorage.setItem(this.tokenKey, data.token);
      localStorage.setItem(this.userKey, JSON.stringify({ username }));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      return false;
    }
  }
  
  // Build a full API URL from the base URL and path
  buildApiUrl(baseUrl: string, apiPath: string): string {
    // Normalize the base URL to ensure it ends with a slash
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    
    // Normalize the API path to ensure it doesn't start with a slash
    const normalizedApiPath = apiPath.startsWith('/') ? apiPath.substring(1) : apiPath;
    
    // Combine them
    return `${normalizedBaseUrl}${normalizedApiPath}`;
  }
  
  // Save the base URL for future reference
  saveBaseUrl(baseUrl: string): void {
    localStorage.setItem(this.baseUrlKey, baseUrl);
  }
  
  // Get the stored base URL
  getBaseUrl(): string | null {
    return localStorage.getItem(this.baseUrlKey);
  }
  
  // Logout the user
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    // Don't remove the baseUrl so it can be reused on the next login
  }
  
  // Check if the user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  
  // Get the current user
  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }
  
  // Get the auth token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  // Get auth header for API requests
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Export a singleton instance
export const authService = new AuthService();
