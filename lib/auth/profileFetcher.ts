import { supabase } from '../supabase';
import type { AppProfile, DeltanHubRole } from './roles';
import { normalizeRole } from './roles';

// In-memory profile cache with 60-second TTL
let cachedProfile: AppProfile | null = null;
let cachedUserId: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

export function clearProfileCache(): void {
  cachedProfile = null;
  cachedUserId = null;
  cacheTimestamp = 0;
}

export async function getCurrentProfile(forceRefresh = false): Promise<AppProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    clearProfileCache();
    return null;
  }

  const now = Date.now();
  if (!forceRefresh && cachedProfile && cachedUserId === user.id && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedProfile;
  }

  // 1. Query user_profiles table directly
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, display_name, avatar_url, main_role, verification_status, phone')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      const isVerified = data.verification_status === 'verified';
      const resolvedName =
        data.display_name?.trim() ||
        data.full_name?.trim() ||
        user.user_metadata?.full_name?.trim() ||
        null;

      const profile: AppProfile = {
        id: data.user_id,
        email: data.email || user.email || '',
        fullName: resolvedName,
        displayName: data.display_name?.trim() || null,
        avatarUrl: data.avatar_url || user.user_metadata?.avatar_url || null,
        mainRole: normalizeRole(data.main_role),
        isVerified,
        phone: data.phone || null,
      };

      cachedProfile = profile;
      cachedUserId = user.id;
      cacheTimestamp = now;
      return profile;
    }
  } catch (err) {
    console.warn('[Auth] Primary user_profiles query failed, falling back to RPC:', err);
  }

  // 2. Secondary fallback via get_public_user_profiles RPC
  try {
    const { data: rpcProfiles, error: rpcError } = await supabase.rpc('get_public_user_profiles', {
      requested_user_ids: [user.id],
    });

    if (!rpcError && rpcProfiles && rpcProfiles.length > 0) {
      const p = rpcProfiles[0];
      const isVerified = p.is_verified === true || p.verification_status === 'verified';
      const resolvedName =
        p.display_name?.trim() ||
        p.full_name?.trim() ||
        user.user_metadata?.full_name?.trim() ||
        null;

      const profile: AppProfile = {
        id: p.user_id,
        email: user.email || '',
        fullName: resolvedName,
        displayName: p.display_name?.trim() || null,
        avatarUrl: p.avatar_url || user.user_metadata?.avatar_url || null,
        mainRole: normalizeRole(p.main_role),
        isVerified,
        phone: null,
      };

      cachedProfile = profile;
      cachedUserId = user.id;
      cacheTimestamp = now;
      return profile;
    }
  } catch (rpcErr) {
    console.warn('[Auth] Secondary get_public_user_profiles RPC failed:', rpcErr);
  }

  // 3. Fallback to auth session metadata
  const fallbackProfile: AppProfile = {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name?.trim() || null,
    displayName: user.user_metadata?.display_name?.trim() || null,
    avatarUrl: user.user_metadata?.avatar_url || null,
    mainRole: normalizeRole(user.user_metadata?.main_role || user.user_metadata?.role),
    isVerified: false,
    phone: user.phone || null,
  };

  cachedProfile = fallbackProfile;
  cachedUserId = user.id;
  cacheTimestamp = now;
  return fallbackProfile;
}
