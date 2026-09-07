import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import {
  getCurrentProfile,
  clearProfileCache,
  isProfessionalRole,
  canReceiveLeads as checkCanReceiveLeads,
  canAssignAgents as checkCanAssignAgents,
  formatRoleLabel,
  type AppProfile,
  type DeltanHubRole,
} from '../lib/auth';

export interface UseAuthProfileReturn {
  profile: AppProfile | null;
  loading: boolean;
  error: Error | null;
  role: DeltanHubRole;
  isProfessional: boolean;
  canReceiveLeads: boolean;
  canAssignAgents: boolean;
  roleLabel: string;
  refreshProfile: () => Promise<AppProfile | null>;
}

/**
 * useAuthProfile
 * Clean Architecture reactive hook exposing authenticated user identity, role, and granular capabilities.
 * Synchronized with DeltanHub role foundations and automatically refreshed on auth changes & app foreground.
 */
export function useAuthProfile(): UseAuthProfileReturn {
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef<boolean>(true);

  const fetchProfile = useCallback(async (forceRefresh = false): Promise<AppProfile | null> => {
    try {
      if (forceRefresh) {
        clearProfileCache();
      }
      const data = await getCurrentProfile(forceRefresh);
      if (isMounted.current) {
        setProfile(data);
        setError(null);
        setLoading(false);
      }
      return data;
    } catch (err: any) {
      if (isMounted.current) {
        setError(err);
        setLoading(false);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchProfile();

    // Listen to Supabase auth state transitions
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearProfileCache();
        if (isMounted.current) {
          setProfile(null);
          setLoading(false);
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        fetchProfile(true);
      }
    });

    // Refresh profile on app foreground
    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        fetchProfile(false);
      }
    });

    return () => {
      isMounted.current = false;
      authListener?.subscription?.unsubscribe();
      appStateSub.remove();
    };
  }, [fetchProfile]);

  const role: DeltanHubRole = profile?.mainRole || 'Buyer';
  const isProfessional = isProfessionalRole(role);
  const canLeads = checkCanReceiveLeads(role);
  const canAssign = checkCanAssignAgents(role);
  const roleLabel = formatRoleLabel(role);

  return {
    profile,
    loading,
    error,
    role,
    isProfessional,
    canReceiveLeads: canLeads,
    canAssignAgents: canAssign,
    roleLabel,
    refreshProfile: () => fetchProfile(true),
  };
}
