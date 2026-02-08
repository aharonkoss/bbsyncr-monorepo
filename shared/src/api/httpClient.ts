import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '../config/env';

// Create axios instance with cookie support
export const createHttpClient = (
  getToken?: () => Promise<string | null>
): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.baseUrl,
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // ✅ CRITICAL: Send cookies with every request
  });

  // ❌ NO request interceptor - we're using cookies, not Bearer tokens

  // Response interceptor - handle 401 errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        console.error('Unauthorized - redirecting to login');
        // Redirect to login on 401
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Export default instance
export const httpClient = createHttpClient();
