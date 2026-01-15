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
    
    // Debug log for CORS troubleshooting
    console.log('API Request:', {
      url: `${config.baseURL || ''}${config.url || ''}`,
      method: config.method,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to convert snake_case to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

// Helper function to recursively convert object keys from snake_case to camelCase
const convertKeysToUpperCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToUpperCase(item));
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = toCamelCase(key);
        converted[camelKey] = convertKeysToUpperCase(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
};

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('API Response (raw):', response.status, response.data);
    
    // Transform snake_case to camelCase
    if (response.data && typeof response.data === 'object') {
      response.data = convertKeysToUpperCase(response.data);
    }
    
    console.log('API Response (converted):', response.status, response.data);
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
