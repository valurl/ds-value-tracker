import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { INITIAL_PROFILES } from '@/lib/demoStore';

const CURRENT_USER_KEY = 'ds_current_user_profile';
const PROFILES_STORAGE_KEY = 'ds_profiles_cache';

export function getLocalProfiles(): Profile[] {
  if (typeof window === 'undefined') return INITIAL_PROFILES;
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(INITIAL_PROFILES));
      return INITIAL_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROFILES;
  }
}

export function saveLocalProfiles(profiles: Profile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save profiles locally:', e);
  }
}

/**
 * Returns currently logged-in user profile or null if logged out.
 * No fake fallback user is returned when logged out.
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  if (isSupabaseConfigured()) {
    try {
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
        return {
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'DinoPlayer',
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
          reputation: 100,
          is_admin: user.user_metadata?.is_admin || false,
          created_at: user.created_at,
        };
      }

      return data as Profile;
    } catch (e) {
      console.error('Error fetching current user profile:', e);
      return null;
    }
  }

  // Local storage mode: check if user explicitly logged in
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function signInUser(
  email: string,
  password?: string
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: password || 'DinoTraderPass123!',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const profile = await getCurrentUserProfile();
    return { success: true, user: profile || undefined };
  }

  // Local mode sign in
  const profiles = getLocalProfiles();
  const username = email.split('@')[0] || 'DinoPlayer';
  let profile = profiles.find(p => p.username.toLowerCase() === username.toLowerCase());

  if (!profile) {
    profile = {
      id: 'user-' + username.toLowerCase().replace(/[^a-z0-9]/g, ''),
      username,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      reputation: 100,
      is_admin: username.toLowerCase().includes('admin'),
      created_at: new Date().toISOString(),
    };
    saveLocalProfiles([...profiles, profile]);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
  }
  return { success: true, user: profile };
}

export async function signUpUser(
  email: string,
  password?: string,
  username?: string
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  const chosenUsername = username?.trim() || email.split('@')[0];

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || 'DinoTraderPass123!',
      options: {
        data: {
          username: chosenUsername,
          is_admin: false,
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
        is_admin: false,
        created_at: data.user.created_at,
      };
      return { success: true, user: profile };
    }

    return { success: true };
  }

  // Local mode registration
  const profiles = getLocalProfiles();
  const newProfile: Profile = {
    id: 'user-' + Date.now().toString(36),
    username: chosenUsername,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${chosenUsername}`,
    reputation: 100,
    is_admin: chosenUsername.toLowerCase().includes('admin'),
    created_at: new Date().toISOString(),
  };

  saveLocalProfiles([...profiles, newProfile]);
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProfile));
  }
  return { success: true, user: newProfile };
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out of Supabase:', e);
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// -----------------------------------------------------------------------------
// ADMIN USER MANAGEMENT
// -----------------------------------------------------------------------------
export async function getAllProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('reputation', { ascending: false });

    if (error) {
      console.error('Supabase getAllProfiles error:', error);
      return getLocalProfiles();
    }
    return (data as Profile[]) || [];
  }

  return getLocalProfiles();
}

export async function setUserAdminStatus(
  username: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    // Attempt via RPC if migration was run
    const { error: rpcError } = await supabase.rpc('set_user_admin', {
      p_username: username,
      p_is_admin: isAdmin,
    });

    if (!rpcError) return { success: true };

    // Fallback direct update
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .ilike('username', username);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
    return { success: true };
  }

  const profiles = getLocalProfiles();
  const idx = profiles.findIndex(p => p.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return { success: false, error: 'User not found' };

  profiles[idx].is_admin = isAdmin;
  saveLocalProfiles(profiles);

  // Update current user if active
  const cur = await getCurrentUserProfile();
  if (cur && cur.username.toLowerCase() === username.toLowerCase()) {
    cur.is_admin = isAdmin;
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cur));
    }
  }

  return { success: true };
}
