import axios from 'axios';
import { storage } from '../utils/storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const API_BASE_URL = 'http://192.168.4.22:3000/api'; // Replace XXX with your IP


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        await storage.saveToken(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await storage.clearAll();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
export const api = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  forgotPassword: (data) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  createClient: (data) => apiClient.post('/clients', data),
  getClients: () => apiClient.get('/clients'),
  resendDocument: (clientId) => apiClient.post(`/clients/${clientId}/resend`),
    downloadClientPDF: async (clientId) => {
    try {
      console.log(`⬇️ Starting PDF download for client ID: ${clientId}`);
      const url = `${API_BASE_URL}/clients/${clientId}/pdf`;
      const fileUri = FileSystem.documentDirectory + `Client_${clientId}.pdf`;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      console.log('✅ File downloaded:', uri);

      await Sharing.shareAsync(uri);
      console.log('📤 File shared successfully');
      return uri;
    } catch (error) {
      console.error('❌ Error downloading client PDF:', error.message);
      alert('Failed to download the client PDF. Please check network connectivity or backend.');
      throw error;
    }
  },
};
export const baseUrl = API_BASE_URL;
