import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getStoredTokens, 
  storeTokens, 
  clearTokens, 
  isTokenExpired, 
  refreshAccessToken,
  initiateSpotifyLogin as initiateLogin,
} from '@/lib/spotify-auth';
import { getCurrentUser, SpotifyUser } from '@/lib/spotify-api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SpotifyUser | null;
  accessToken: string | null;
  login: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const userData = await getCurrentUser(token);
      setUser(userData);
      setIsAuthenticated(true);
      setAccessToken(token);
      return true;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return false;
    }
  }, []);

  const refreshTokenHandler = useCallback(async (): Promise<boolean> => {
    const { refreshToken: storedRefreshToken } = getStoredTokens();
    if (!storedRefreshToken) return false;

    const tokenData = await refreshAccessToken(storedRefreshToken);
    if (!tokenData) {
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      return false;
    }

    storeTokens(
      tokenData.access_token,
      tokenData.refresh_token || storedRefreshToken,
      tokenData.expires_in
    );
    
    return await fetchUser(tokenData.access_token);
  }, [fetchUser]);

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    const { accessToken: storedToken, refreshToken: storedRefresh } = getStoredTokens();

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    if (isTokenExpired() && storedRefresh) {
      const success = await refreshTokenHandler();
      if (!success) {
        clearTokens();
      }
    } else if (storedToken) {
      const success = await fetchUser(storedToken);
      if (!success && storedRefresh) {
        await refreshTokenHandler();
      }
    }

    setIsLoading(false);
  }, [fetchUser, refreshTokenHandler]);

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Listen for token changes (from Callback page or logout)
  useEffect(() => {
    const handleAuthChange = () => {
      initAuth();
    };

    window.addEventListener('spotify-auth-changed', handleAuthChange);
    return () => {
      window.removeEventListener('spotify-auth-changed', handleAuthChange);
    };
  }, [initAuth]);

  const login = async () => {
    await initiateLogin();
  };

  const logout = () => {
    clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        accessToken,
        login,
        logout,
        refreshToken: refreshTokenHandler,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
