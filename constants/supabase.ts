import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qwwctklnvwvwwusxkgjb.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3d2N0a2xudnd2d3d1c3hrZ2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODY1MTksImV4cCI6MjA2OTQ2MjUxOX0.Lb68NCRQAs6dJLBOczm5ht03pr-mFCuDJwStwhSqpAg';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

// Debug configuration
console.log('=== SUPABASE CONFIG ===');
console.log('URL:', supabaseUrl);
console.log('Key preview:', supabaseAnonKey.substring(0, 30) + '...');
console.log('======================');

// Custom storage adapter for React Native
const customStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: customStorage,
  },
  global: {
    headers: {
      'X-Client-Info': 'expo-receiptly@1.0.0',
    },
  },
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
    
    // Test basic connection by getting session (doesn't require tables)
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Connection test successful');
    return { success: true, data: 'Connection successful' };
  } catch (networkError) {
    console.error('Network error during connection test:', networkError);
    return { success: false, error: 'Network request failed' };
  }
};

export type Database = {
  public: {
    Tables: {
      receipts: {
        Row: {
          id: string;
          user_id: string;
          merchant: string;
          total: number;
          tax: number;
          category: string;
          receipt_date: string;
          items: any;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          merchant: string;
          total: number;
          tax: number;
          category: string;
          receipt_date: string;
          items: any;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          merchant?: string;
          total?: number;
          tax?: number;
          category?: string;
          receipt_date?: string;
          items?: any;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          icon: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          icon?: string;
          created_at?: string;
        };
      };
    };
  };
};