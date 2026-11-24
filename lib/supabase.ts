import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 10
  );
};

// Safe client instantiation: avoids throw during build or initial setup
let client: SupabaseClient;

if (isSupabaseConfigured()) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Fallback placeholder client to prevent SSR and compile crashes
  client = createClient(
    'https://placeholder-domain-replace-in-env.supabase.co',
    'placeholder-anon-key'
  );
}

export const supabase = client;
export default supabase;
