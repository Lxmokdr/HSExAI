import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient, User } from "@/services/api";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem("enna_user");
        const token = localStorage.getItem("enna_token");
        
        if (savedUser && token) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Verify token is still valid
          try {
            await apiClient.getProfile();
          } catch (err: any) {
            // Token might be expired, try to refresh
            if (err.status === 401) {
              try {
                await apiClient.refreshToken();
                // Retry profile fetch
                await apiClient.getProfile();
              } catch (refreshErr: any) {
                // Refresh failed, clear auth data
                console.error("Token refresh failed, clearing auth:", refreshErr.message);
                localStorage.removeItem("enna_user");
                localStorage.removeItem("enna_token");
                localStorage.removeItem("enna_refresh_token");
                apiClient.setToken(null);
                apiClient.setRefreshToken(null);
                setUser(null);
              }
            } else {
              // Other error, clear auth data
              console.error("Token validation failed, clearing auth:", err.message);
            localStorage.removeItem("enna_user");
            localStorage.removeItem("enna_token");
              localStorage.removeItem("enna_refresh_token");
            apiClient.setToken(null);
              apiClient.setRefreshToken(null);
            setUser(null);
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError("Erreur lors de l'initialisation de l'authentification");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.login({ username, password });
      setUser(response.user);
    } catch (err: any) {
      // Handle account lockout
      if (err.status === 423 || err.locked) {
        const lockedMessage = err.locked_until 
          ? `Compte verrouillé. Réessayez plus tard.`
          : err.message || "Compte verrouillé après plusieurs tentatives échouées";
        setError(lockedMessage);
      } else if (err.status === 429) {
        // Rate limiting
        setError("Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.");
      } else {
      setError(err.message || "Erreur de connexion");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setError(null);
      localStorage.removeItem("enna_user");
      localStorage.removeItem("enna_token");
      localStorage.removeItem("enna_refresh_token");
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
