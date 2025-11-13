import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/env';

// Create axios instance
export const createHttpClient = (
  getToken?: () => Promise<string | null>
): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.baseUrl,
    timeout: API_CONFIG.timeout,
    headers: API_CONFIG.headers,
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (getToken) {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
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
