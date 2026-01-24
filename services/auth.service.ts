import { HR_ENDPOINTS } from '@/contants/urls';
import axiosInstance from '@/helpers/api/axiosInstance';
import { getAvatarByUserId } from '@/helpers/avatarUtils';

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
      avatar?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  error?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  password?: string;
  roles: string[];
  avatar?: string;
  firstName?: string;
  lastName?: string;
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
    try {
      const response = await axiosInstance.post(HR_ENDPOINTS.AUTH.LOGIN, credentials);
      
      const data = response.data;
      
      // Backend response yapısı: { success, data: { token, user: { id, email, roles, firstName, lastName } } }
      if (data.success && data.data?.token && data.data?.user) {
        let user = data.data.user;
        
        // Assign avatar based on user ID
        user.avatar = getAvatarByUserId(user.id);
        
        // Store token and user info
        localStorage.setItem('hr_auth_token', data.data.token);
        localStorage.setItem('hr_user_profile', JSON.stringify(user));
        setCookie('hr_auth_token', data.data.token, 7);
                
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
      
      let errorMessage = "Bilinmeyen hata oluştu";
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
      let profile = response.data.data as UserProfile;
      
      // Assign avatar if not already set
      if (!profile.avatar) {
        profile.avatar = getAvatarByUserId(profile.id);
      }
      
      localStorage.setItem('hr_user_profile', JSON.stringify(profile));
      return profile;
    } catch (error) {
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post(HR_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
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
