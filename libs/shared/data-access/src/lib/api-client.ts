import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

// Get base URL - support both Vite and fallback environments
const getBaseUrl = (): string => {
  // Vite environment
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Node.js / fallback
  if (typeof process !== 'undefined' && process.env?.['API_URL']) {
    return process.env['API_URL'];
  }
  return 'http://localhost:3000/api';
};

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const baseURL = getBaseUrl();

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response.data,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config;

      // Skip redirect for auth/me endpoint to prevent loop
      const isAuthMeRequest = originalRequest?.url?.includes('/auth/me');

      if (error.response?.status === 401 && !isAuthMeRequest) {
        // Token expired, try to refresh
        const refresh =
          refreshToken ||
          (typeof window !== 'undefined'
            ? localStorage.getItem('refreshToken')
            : null);

        if (refresh) {
          try {
            const response = await axios.post(`${baseURL}/auth/refresh`, {
              refreshToken: refresh,
            });

            const {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            } = response.data;
            setTokens(newAccessToken, newRefreshToken);

            // Retry original request
            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return client.request(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens (don't redirect, let component handle it)
            clearTokens();
          }
        } else {
          clearTokens();
        }
      }

      return Promise.reject(
        error.response?.data || { message: 'An error occurred' }
      );
    }
  );

  return client;
};

export const apiClient = createApiClient();
