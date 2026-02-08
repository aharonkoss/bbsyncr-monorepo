import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_CONFIG } from '../config/env';

// Create axios instance
export const createHttpClient = (
  getToken?: () => Promise<string | null>
): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.baseUrl,
    withCredentials: true,
    timeout: 30000, // 30 seconds timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

 // Response interceptor - handle 401 errors
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Redirect to login on 401
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized - clear token, redirect to login
        console.error('Unauthorized - token may be expired');
      }
      return Promise.reject(error);
    }
  );

  return client;
};
// Create and export the default http client
export const httpClient = createHttpClient(async () => null);