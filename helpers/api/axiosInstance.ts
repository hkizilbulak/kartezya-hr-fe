import { HR_API_BASE_URL } from '@/contants/urls';
import axios from 'axios';

const headers: Readonly<Record<string, string | boolean>> = {
  Accept: "application/json",
  "Content-Type": "application/json; charset=utf-8",
  "X-Requested-With": "XMLHttpRequest",
};

const axiosInstance = axios.create({
  baseURL: HR_API_BASE_URL, // Backend API base URL
  headers,
  withCredentials: false, // CORS için false yaptık
  timeout: 10000 // 10 saniye timeout
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('hr_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle CORS errors
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.error('CORS Error Details:', {
        error: error.message,
        config: error.config,
        response: error.response
      });
    }
    
    // Handle 401 errors - only redirect if not already on login page
    if (error.response?.status === 401) {
      localStorage.removeItem('hr_auth_token');
      localStorage.removeItem('hr_user_profile');
      
      // Cookie'den de token'ı kaldır
      document.cookie = 'hr_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Sadece login sayfasında değilsek yönlendir
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
