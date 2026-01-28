import { ApiClient, createHttpClient } from '@my-real-estate-app/shared';

// Simple token getter for web (uses localStorage)
const getToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Create HTTP client with token getter
const httpClient = createHttpClient(getToken);

// Export API client instance
export const api = new ApiClient(httpClient);

// Token management utilities
export const tokenManager = {
  saveToken: (token: string) => {
    localStorage.setItem('token', token);
  },
  
  saveRefreshToken: (refreshToken: string) => {
    localStorage.setItem('refreshToken', refreshToken);
  },
  
  saveUser: (user: any) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  clearAll: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};
