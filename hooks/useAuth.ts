import { useState, useEffect } from 'react';
import { authService, LoginRequest, UserProfile } from '@/services/auth.service';

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();
      
      setIsAuthenticated(isAuth);
      setUser(currentUser);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return response;
      }
      throw new Error(response.error || 'Giriş yapılırken bir hata oluştu');
    } catch (error: any) {
      // Pass through the error message from auth service
      throw new Error(error.message || 'Giriş yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('kvkk_postponed');
        sessionStorage.removeItem('kvkk_submitted');
      }
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      // If profile fetch fails, user might be unauthorized
      logout();
      throw error;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshProfile
  };
};