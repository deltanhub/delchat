import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { formatWhatsAppLastSeen } from '../lib/presence-utils';

export interface UseThreadPresenceOptions {
  conversationId: string | null;
  currentUserId: string | null;
  partnerUserId: string | null;
  initialLastSeenAt?: string | null;
  fallbackSubtitle?: string;
}

export interface UseThreadPresenceReturn {
  isPartnerOnline: boolean;
  isPartnerTyping: boolean;
  partnerLastSeenAt: string | null;
  lastSeenText: string;
  sendTyping: (isTyping: boolean) => void;
  clearPartnerTyping: () => void;
  handleComposerTextChange: (text: string) => void;
}

/**
 * useThreadPresence
 * Clean Architecture hook managing realtime online presence and typing broadcasts.
 * Synchronized with DeltanHub Web presence channels and touch_user_presence RPC.
 */
export function useThreadPresence({
  conversationId,
  currentUserId,
  partnerUserId,
  initialLastSeenAt = null,
  fallbackSubtitle,
}: UseThreadPresenceOptions): UseThreadPresenceReturn {
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [partnerLastSeenAt, setPartnerLastSeenAt] = useState<string | null>(initialLastSeenAt);

  const typingChannelRef = useRef<any>(null);
  const partnerTypingTimeoutRef = useRef<any>(null);
  const localTypingTimeoutRef = useRef<any>(null);
  const lastTypingSentTimeRef = useRef<number>(0);

  // Sync initial last seen if updated externally
  useEffect(() => {
    if (initialLastSeenAt && !partnerLastSeenAt) {
      setPartnerLastSeenAt(initialLastSeenAt);
    }
  }, [initialLastSeenAt, partnerLastSeenAt]);

  // Touch presence on mount and when app returns to foreground
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

  // Fetch partner's latest last_seen_at from database
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

  // Supabase Realtime Channels (Presence and Typing)
  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setIsPartnerOnline(false);
      setIsPartnerTyping(false);
      return;
    }

    // 1. Realtime Presence Channel: presence:${conversationId} matching DeltanHub web
    const presenceChannel = supabase.channel(`presence:${conversationId}`, {
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

    // 2. Realtime Typing Broadcast Channel: chat-typing:${conversationId} matching DeltanHub web
    const typingChannel = supabase.channel(`chat-typing:${conversationId}`);
    typingChannelRef.current = typingChannel;

    typingChannel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const data = payload?.payload || {};
        const senderUserId = data.userId || '';

        if (!senderUserId || senderUserId === currentUserId) return;

        if (!data.isTyping) {
          setIsPartnerTyping(false);
          if (partnerTypingTimeoutRef.current) {
            clearTimeout(partnerTypingTimeoutRef.current);
            partnerTypingTimeoutRef.current = null;
          }
          return;
        }

        setIsPartnerTyping(true);
        if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
        partnerTypingTimeoutRef.current = setTimeout(() => {
          setIsPartnerTyping(false);
        }, 3500);
      })
      .subscribe();

    return () => {
      if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
      if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
      void supabase.removeChannel(presenceChannel);
      void supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [conversationId, currentUserId, partnerUserId]);

  // Outgoing typing broadcast with CCU rate-limiting
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!typingChannelRef.current || !currentUserId) return;

      void typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          isTyping,
        },
      });
    },
    [currentUserId]
  );

  const handleComposerTextChange = useCallback(
    (text: string) => {
      if (!typingChannelRef.current || !currentUserId) return;

      if (text.length === 0) {
        if (localTypingTimeoutRef.current) {
          clearTimeout(localTypingTimeoutRef.current);
          localTypingTimeoutRef.current = null;
        }
        lastTypingSentTimeRef.current = 0;
        sendTyping(false);
        return;
      }

      const now = Date.now();
      // Throttle broadcast to max once every 2 seconds while actively typing
      if (now - lastTypingSentTimeRef.current > 2000) {
        lastTypingSentTimeRef.current = now;
        sendTyping(true);
      }

      // Auto-idle reset after 2.8s of silence
      if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
      localTypingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2800);
    },
    [currentUserId, sendTyping]
  );

  const clearPartnerTyping = useCallback(() => {
    setIsPartnerTyping(false);
    if (partnerTypingTimeoutRef.current) {
      clearTimeout(partnerTypingTimeoutRef.current);
      partnerTypingTimeoutRef.current = null;
    }
  }, []);

  const lastSeenText = formatWhatsAppLastSeen(
    partnerLastSeenAt,
    isPartnerOnline,
    isPartnerTyping,
    fallbackSubtitle
  );

  return {
    isPartnerOnline,
    isPartnerTyping,
    partnerLastSeenAt,
    lastSeenText,
    sendTyping,
    clearPartnerTyping,
    handleComposerTextChange,
  };
}
