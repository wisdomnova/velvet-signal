// ./store/auth.ts

import { create } from 'zustand'
import { SignUpData, User } from '@/types/database'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (data: SignUpData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  checkAuth: () => Promise<void> 
}

// Helper functions for cookie management
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Initialize state from cookies
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isAuthenticated: false };
  }

  const token = getCookie('auth-token');
  const userStr = getCookie('auth-user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(decodeURIComponent(userStr));
      return { user, token, isAuthenticated: true };
    } catch {
      // Clean up invalid cookies
      deleteCookie('auth-token');
      deleteCookie('auth-user');
    }
  }
  
  return { user: null, token: null, isAuthenticated: false };
};

export const useAuthStore = create<AuthState>((set, get) => {
  const initialState = getInitialState();

  return {
    user: initialState.user,
    token: initialState.token,
    isLoading: false,
    isAuthenticated: initialState.isAuthenticated,

    login: async (email: string, password: string) => {
      set({ isLoading: true });
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store in cookies
          setCookie('auth-token', data.token, 7);
          setCookie('auth-user', encodeURIComponent(JSON.stringify(data.user)), 7);

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } else {
          set({ isLoading: false });
          return { success: false, error: data.error };
        }
      } catch (error) {
        set({ isLoading: false });
        return { success: false, error: 'Network error occurred' };
      }
    },

    signup: async (data: SignUpData) => {
      set({ isLoading: true });
      
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          // Store in cookies
          setCookie('auth-token', result.token, 7);
          setCookie('auth-user', encodeURIComponent(JSON.stringify(result.user)), 7);

          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } else {
          set({ isLoading: false });
          return { success: false, error: result.error };
        }
      } catch (error) {
        set({ isLoading: false });
        return { success: false, error: 'Network error occurred' };
      }
    },

    logout: () => {
      // Clear cookies
      deleteCookie('auth-token');
      deleteCookie('auth-user');

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    },

    setUser: (user) => {
      set({ user });
      if (user) {
        setCookie('auth-user', encodeURIComponent(JSON.stringify(user)), 7);
      }
    },

    setToken: (token) => {
      set({ token });
      if (token) {
        setCookie('auth-token', token, 7);
      }
    },

    checkAuth: async () => {
      const { token } = get();
      if (!token) {
        set({ user: null, isAuthenticated: false });
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const { user } = await response.json();
          set({ user, isAuthenticated: true });
          setCookie('auth-user', encodeURIComponent(JSON.stringify(user)), 7);
        } else {
          // Clear invalid auth data
          deleteCookie('auth-token');
          deleteCookie('auth-user');
          set({ user: null, token: null, isAuthenticated: false });
        }
      } catch (error) {
        // Clear invalid auth data
        deleteCookie('auth-token');
        deleteCookie('auth-user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    },
  };
});