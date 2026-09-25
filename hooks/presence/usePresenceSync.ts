import { useState, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '../../lib/supabase';

export interface UsePresenceSyncParams {
  conversationId: string | null;
  currentUserId: string | null;
  partnerUserId: string | null;
  initialLastSeenAt?: string | null;
}

export function usePresenceSync({
  conversationId,
  currentUserId,
  partnerUserId,
  initialLastSeenAt = null,
}: UsePresenceSyncParams) {
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [partnerLastSeenAt, setPartnerLastSeenAt] = useState<string | null>(initialLastSeenAt);

  useEffect(() => {
    if (initialLastSeenAt && !partnerLastSeenAt) {
      setPartnerLastSeenAt(initialLastSeenAt);
    }
  }, [initialLastSeenAt, partnerLastSeenAt]);

  useEffect(() => {
    if (!currentUserId) return;
    void supabase.rpc('touch_user_presence');
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        void supabase.rpc('touch_user_presence');
      }
    });
    return () => {
      subscription.remove();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!partnerUserId) return;
    let isMounted = true;
    (async () => {
      try {
        const { data } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: [partnerUserId],
        });
        const profiles = data as Array<{ last_seen_at?: string | null }> | null;
        if (isMounted && profiles && profiles[0]?.last_seen_at) {
          setPartnerLastSeenAt(profiles[0].last_seen_at);
        }
      } catch {
        // Non-critical network recovery
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [partnerUserId]);

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setIsPartnerOnline(false);
      return;
    }

    const presenceChannelName = `presence:${conversationId}`;
    const existingPresence = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${presenceChannelName}` || (ch as any).subTopic === presenceChannelName
    );
    if (existingPresence) {
      void supabase.removeChannel(existingPresence);
    }

    const presenceChannel = supabase.channel(presenceChannelName, {
      config: { presence: { key: currentUserId } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const isOnline = Boolean(partnerUserId && Object.keys(state).includes(partnerUserId));
        setIsPartnerOnline(isOnline);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === partnerUserId) {
          setIsPartnerOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === partnerUserId) {
          setIsPartnerOnline(false);
          setPartnerLastSeenAt(new Date().toISOString());
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: currentUserId,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      void supabase.removeChannel(presenceChannel);
    };
  }, [conversationId, currentUserId, partnerUserId]);

  return { isPartnerOnline, partnerLastSeenAt };
}
