import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read raw environment variables
let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Automatically normalize dashboard URLs (e.g. https://supabase.com/dashboard/project/<id>)
// to the actual Supabase API Gateway (https://<id>.supabase.co)
if (rawUrl.includes('supabase.com/dashboard/project/')) {
  const match = rawUrl.match(/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    rawUrl = `https://${match[1]}.supabase.co`;
  }
}

export const supabaseUrl = rawUrl;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder') &&
    supabaseAnonKey.length > 10
  );
};

// Safe client instantiation
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
