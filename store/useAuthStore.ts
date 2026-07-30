// ============================================================
// STREAKER — Auth Store (Zustand + AsyncStorage persistence)
// ============================================================

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, RegisterForm, LoginForm } from '../types';
import { COINS } from '../utils/constants';

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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  error: null,

  hydrate: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch user profile from DB
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          set({ user: profile as User, isAuthenticated: true, isHydrated: true });
        } else {
          set({ isHydrated: true });
        }
      } else {
        set({ isHydrated: true });
      }

      // Setup auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null, isAuthenticated: false });
        }
      });
    } catch (e) {
      set({ isHydrated: true });
    }
  },

  login: async (form: LoginForm) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned');

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      set({
        user: profile as User,
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
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username,
            display_name: form.display_name,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Registration failed');

      // Profile is auto-created via trigger, but we need to fetch it
      // Add a slight delay to ensure trigger finishes
      await new Promise(r => setTimeout(r, 1000));
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      set({
        user: profile as User,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, error: null, isLoading: false });
  },

  updateProfile: async (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;
    
    // Optimistic update locally
    const updated = { ...user, ...updates };
    set({ user: updated as User });

    // Update in Supabase
    try {
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
    } catch (e) {
      console.error('Failed to update profile', e);
    }
  },

  updateCoinBalance: async (delta: number) => {
    const { user } = get();
    if (!user) return;
    
    const newBalance = user.coin_balance + delta;
    set({ user: { ...user, coin_balance: newBalance } as User });

    try {
      await supabase
        .from('profiles')
        .update({ coin_balance: newBalance })
        .eq('id', user.id);
    } catch (e) {
      console.error('Failed to update coin balance', e);
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },
}));
