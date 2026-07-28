// ============================================================
// STREAKER — Auth Store (Zustand + AsyncStorage persistence)
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, RegisterForm, LoginForm } from '../types';
import { MOCK_CURRENT_USER } from '../utils/mockData';
import { COINS } from '../utils/constants';

const AUTH_STORAGE_KEY = 'streaker_auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // Actions
  login: (form: LoginForm) => Promise<void>;
  register: (form: RegisterForm) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  updateCoinBalance: (delta: number) => void;
  clearError: () => void;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>;
}

async function persistAuth(user: User | null) {
  try {
    if (user) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    // Storage error — ignore
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  error: null,

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        set({ user, isAuthenticated: true, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch (e) {
      set({ isHydrated: true });
    }
  },

  login: async (form: LoginForm) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with Supabase auth
      await new Promise((r) => setTimeout(r, 800));

      // Mock: accept any email/password
      const user = MOCK_CURRENT_USER;
      await persistAuth(user);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
    }
  },

  register: async (form: RegisterForm) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with Supabase auth
      await new Promise((r) => setTimeout(r, 1000));

      const newUser: User = {
        id: 'user-new-' + Date.now(),
        username: form.username,
        display_name: form.display_name,
        avatar_url: null,
        bio: null,
        coin_balance: COINS.SIGNUP_BONUS,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await persistAuth(newUser);
      set({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
    }
  },

  logout: () => {
    persistAuth(null);
    set({ user: null, isAuthenticated: false, error: null });
  },

  updateProfile: (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
    persistAuth(updated);
    set({ user: updated });
  },

  updateCoinBalance: (delta: number) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, coin_balance: user.coin_balance + delta };
    persistAuth(updated);
    set({ user: updated });
  },

  clearError: () => set({ error: null }),

  setUser: (user: User) => {
    persistAuth(user);
    set({ user, isAuthenticated: true });
  },
}));
