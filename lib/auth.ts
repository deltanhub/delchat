import { supabase } from './supabase';

export interface AppProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  mainRole: 'agent' | 'agency' | 'landlord' | 'developer' | 'buyer';
}

export async function getCurrentProfile(): Promise<AppProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, avatar_url, main_role')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    console.error('[Auth] Error fetching user profile:', error);
    return {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      mainRole: 'buyer', // default fallback role
    };
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    mainRole: data.main_role,
  };
}
