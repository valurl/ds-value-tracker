import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { INITIAL_PROFILES } from '@/lib/demoStore';

const CURRENT_USER_KEY = 'ds_current_user_profile';

export function getDemoCurrentUser(): Profile {
  if (typeof window === 'undefined') return INITIAL_PROFILES[3]; // 'HeroTrader_You'
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      const defaultUser = INITIAL_PROFILES[3];
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROFILES[3];
  }
}

export function setDemoCurrentUser(profile: Profile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save current user profile:', e);
  }
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  if (isSupabaseConfigured()) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // Create fallback profile object for this auth user
      return {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Player',
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
        reputation: 100,
        created_at: user.created_at,
      };
    }

    return data;
  }

  return getDemoCurrentUser();
}

export async function signInUser(email: string, password?: string): Promise<{ success: boolean; user?: Profile; error?: string }> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || 'TestPass123!',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const profile = await getCurrentUserProfile();
    return { success: true, user: profile || undefined };
  }

  // Demo mode mock sign-in
  const username = email.split('@')[0] || 'HeroTrader';
  const profile: Profile = {
    id: 'user-' + username.toLowerCase().replace(/[^a-z0-9]/g, ''),
    username,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
    reputation: 100,
    created_at: new Date().toISOString(),
  };

  setDemoCurrentUser(profile);
  return { success: true, user: profile };
}

export async function signUpUser(
  email: string,
  password?: string,
  username?: string
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  if (isSupabaseConfigured()) {
    const chosenUsername = username || email.split('@')[0];
    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || 'TestPass123!',
      options: {
        data: {
          username: chosenUsername,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const profile: Profile = {
        id: data.user.id,
        username: chosenUsername,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`,
        reputation: 100,
        created_at: data.user.created_at,
      };
      return { success: true, user: profile };
    }

    return { success: true };
  }

  // Demo sign up
  const chosenUsername = username || email.split('@')[0];
  const profile: Profile = {
    id: 'user-' + Date.now().toString(36),
    username: chosenUsername,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${chosenUsername}`,
    reputation: 100,
    created_at: new Date().toISOString(),
  };

  setDemoCurrentUser(profile);
  return { success: true, user: profile };
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
  // Reset demo user
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}
