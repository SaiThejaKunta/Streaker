// ============================================================
// STREAKER — Supabase Client Configuration
// ============================================================
// This is the Supabase client setup. For now, we use mock data.
// To connect to a real Supabase project:
// 1. Create a free project at https://supabase.com
// 2. Get your URL and anon key from Settings > API
// 3. Create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
// 4. Uncomment the code below

/*
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
*/

// For now, export a placeholder
export const supabase = null;

export const isSupabaseConfigured = () => {
  return (
    !!process.env.EXPO_PUBLIC_SUPABASE_URL &&
    !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
};
