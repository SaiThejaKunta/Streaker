import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

import { decode } from 'base64-arraybuffer';

export async function uploadImageToSupabase(base64Str: string, bucket: string, path: string): Promise<string> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, decode(base64Str), {
        contentType: 'image/jpeg',
        upsert: true,
      });
      
    if (error) throw error;
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
      
    // Append timestamp to bust cache when updating avatar
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
