import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/env';

export const createHttpClient = (
  getToken: () => Promise<string | null>
): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.baseUrl,
    timeout: API_CONFIG.timeout,
    withCredentials: true, // Still send cookies if available
  });

  // Add Authorization header with Bearer token to every request
  client.interceptors.request.use(
    async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};
