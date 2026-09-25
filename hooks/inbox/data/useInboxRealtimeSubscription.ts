import { useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import SyncCoordinator from '../../../lib/sync-coordinator';
import type { UseInboxRealtimeSubscriptionParams } from './types';

export function useInboxRealtimeSubscription({
  currentUser,
  onRefresh,
}: UseInboxRealtimeSubscriptionParams) {
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUser) return;

    const triggerDebouncedFetch = (delay = 400) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onRefresh();
      }, delay);
    };

    const channelName = `inbox-sync-${currentUser.id}`;
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || (ch as any).subTopic === channelName
    );
    if (existing) void supabase.removeChannel(existing);

    const updateChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${currentUser.id}` },
        () => { onRefresh(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${currentUser.id}` },
        () => { triggerDebouncedFetch(1200); }
      )
      .on('broadcast', { event: 'new_message' }, () => { onRefresh(); })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') SyncCoordinator.setStatus('online');
      });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(updateChannel);
    };
  }, [currentUser, onRefresh]);
}
