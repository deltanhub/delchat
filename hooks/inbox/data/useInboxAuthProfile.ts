import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { getCurrentProfile, canAssignAgents, isAgent, AppProfile } from '../../../lib/auth';
import type { InboxTab, UseInboxAuthProfileReturn } from './types';

export function useInboxAuthProfile(): UseInboxAuthProfileReturn {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<AppProfile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);
      getCurrentProfile().then((profile) => {
        if (profile) setCurrentProfile(profile);
      });
    });
  }, [router]);

  const canAssign = canAssignAgents(currentProfile?.mainRole);
  const userIsAgent = isAgent(currentProfile?.mainRole);

  const inboxTabs = useMemo(() => {
    const tabs: { key: InboxTab; label: string }[] = [{ key: 'all', label: 'All' }];
    if (canAssign) tabs.push({ key: 'master-leads', label: 'Master Leads' });
    else if (userIsAgent) tabs.push({ key: 'assigned-leads', label: 'Assigned Leads' });
    else tabs.push({ key: 'leads', label: 'Inquiries' });
    tabs.push({ key: 'favourites', label: 'Favourites' });
    tabs.push({ key: 'support', label: 'Support' });
    return tabs;
  }, [canAssign, userIsAgent]);

  return {
    currentUser,
    currentProfile,
    inboxTabs,
    canAssign,
    userIsAgent,
  };
}
