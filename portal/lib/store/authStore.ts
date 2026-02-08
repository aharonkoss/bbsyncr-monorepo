import { create } from 'zustand';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  company_id: string;
  company: {
    id: string;
    company_name: string;
    subdomain: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    try {
      console.log('🔐 Logging in with:', email);
      
      const { data } = await apiClient.post('/api/portal/auth/login', {
        email,
        password,
      });
      
      console.log('✅ Login API response:', data);
      console.log('👤 User data:', data.user);
      console.log('🏢 Company data:', data.user?.company);
      
      // ✅ Set user from response
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      console.log('✅ User set in authStore:', data.user);
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log('🚪 Logging out...');
      
      // Call logout endpoint to clear cookies
      await apiClient.post('/api/portal/auth/logout');
      
      console.log('✅ Logout successful');
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      // Clear state anyway
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    try {
      console.log('🔍 Checking authentication...');
      
      set({ isLoading: true });
      
      // Check if user is authenticated via cookies
      const { data } = await apiClient.get('/api/portal/auth/me');
      
      console.log('✅ Auth check response:', data);
      
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      
    } catch (error: any) {
      console.log('❌ Not authenticated');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
