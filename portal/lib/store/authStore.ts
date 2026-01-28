import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'global_admin' | 'company_admin' | 'manager';
  company_id?: string;
  title?: string;
  is_active: boolean;
  last_login?: string;
  company?: {
    id: string;
    company_name: string;
    subdomain: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (email: string, password: string) => {
        try {
          // Changed from '/portal/auth/login' to '/portal-auth/login'
          // OR just use the full path without /portal prefix
          const { data } = await apiClient.post('/auth/login', {
            email,
            password,
          });

          // Set token in apiClient
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

          set({
            user: data.user,
            token: data.token,
          });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: () => {
        // Clear token from apiClient
        delete apiClient.defaults.headers.common['Authorization'];
        
        // Clear localStorage
        localStorage.removeItem('auth-storage');
        
        // Reset state
        set({
          user: null,
          token: null,
        });
      },

      setUser: (user: User | null) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Restore token to apiClient after page refresh
        if (state?.token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
