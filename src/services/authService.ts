
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
  
  // Login the user and store the token
  async login(username: string, password: string, serverUrl: string): Promise<boolean> {
    try {
      // Make sure the URL ends with /login
      const loginUrl = serverUrl.endsWith('/') 
        ? `${serverUrl}login` 
        : `${serverUrl}/login`;
      
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
  
  // Logout the user
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
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
