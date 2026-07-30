import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gbvfquftimwvujprgsgc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidmZxdWZ0aW13dnVqcHJnc2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTU4MzcsImV4cCI6MjEwMDgzMTgzN30.WI1uEtXdNpUomWVwdEGi-YNVJEiMuxxTyH5kVQ-MIvY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
