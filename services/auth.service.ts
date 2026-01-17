import { HR_ENDPOINTS } from '@/contants/urls';
import axiosInstance from '@/helpers/api/axiosInstance';
import { getErrorMessage } from '@/helpers/HelperUtils';
import { toast } from 'react-toastify';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: number;
      email: string;
      password?: string;
      roles: string[];
    };
  };
  error?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  password?: string;
  roles: string[];
}

// Cookie management utilities
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=-99999999; path=/`;
};

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('Auth service login called with:', { email: credentials.email, password: '***' });
    try {
      const response = await axiosInstance.post(HR_ENDPOINTS.AUTH.LOGIN, credentials);
      console.log('Raw axios response:', response);
      
      const data = response.data;
      console.log('Full response data:', data);
      console.log('Response data.data:', data.data);
      console.log('Response data.data.user:', data.data?.user);
      console.log('User roles:', data.data?.user?.roles);
      
      // Backend response yapısı: { success, data: { token, user: { id, email, roles } } }
      if (data.success && data.data?.token && data.data?.user) {
        const user = data.data.user;
        console.log('User object:', user);
        console.log('User roles array:', user.roles);
        
        // Store token and user info
        localStorage.setItem('hr_auth_token', data.data.token);
        localStorage.setItem('hr_user_profile', JSON.stringify(user));
        setCookie('hr_auth_token', data.data.token, 7);
        
        console.log('Stored in localStorage - hr_user_profile:', localStorage.getItem('hr_user_profile'));
        
        return {
          success: true,
          data: {
            token: data.data.token,
            user: user
          }
        };
      }
      
      throw new Error('Invalid login response format');
    } catch (error: any) {
      console.error('Auth service error:', error);
      
      let errorMessage = getErrorMessage(error);
      if (error.response && error.response.status === 401) {
        errorMessage = 'E-posta adresiniz yada şifreniz hatalı';
      }
      
      const customError = new Error(String(errorMessage));
      (customError as any).originalError = error;
      throw customError;
    }
  },

  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await axiosInstance.get(HR_ENDPOINTS.AUTH.PROFILE);
      const profile = response.data.data as UserProfile;
      localStorage.setItem('hr_user_profile', JSON.stringify(profile));
      return profile;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post(HR_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all storage
      localStorage.removeItem('hr_auth_token');
      localStorage.removeItem('hr_user_profile');
      deleteCookie('hr_auth_token');
      window.location.href = '/login';
    }
  },

  getCurrentUser: (): UserProfile | null => {
    const userStr = localStorage.getItem('hr_user_profile');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!(localStorage.getItem('hr_auth_token') || getCookie('hr_auth_token'));
  },

  getToken: (): string | null => {
    return localStorage.getItem('hr_auth_token') || getCookie('hr_auth_token');
  }
};
