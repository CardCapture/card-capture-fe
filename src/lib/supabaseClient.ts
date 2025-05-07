// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase URL or Anon Key is missing from environment variables.");
  // You might want to throw an error here in a real app to halt execution
  // throw new Error("Supabase URL or Anon Key is missing from environment variables.");
}

// Export the singleton client instance with redirect configuration
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable automatic hash handling
    flowType: 'pkce', // Use PKCE flow for better security
    storage: window.localStorage,
    storageKey: 'supabase.auth.token'
  }
});