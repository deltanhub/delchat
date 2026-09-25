import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface UseTypingBroadcastParams {
  conversationId: string | null;
  currentUserId: string | null;
}

export function useTypingBroadcast({ conversationId, currentUserId }: UseTypingBroadcastParams) {
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const typingChannelRef = useRef<any>(null);
  const partnerTypingTimeoutRef = useRef<any>(null);
  const localTypingTimeoutRef = useRef<any>(null);
  const lastTypingSentTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setIsPartnerTyping(false);
      return;
    }

    const typingChannelName = `chat-typing:${conversationId}`;
    const existingTyping = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${typingChannelName}` || (ch as any).subTopic === typingChannelName
    );
    if (existingTyping) {
      void supabase.removeChannel(existingTyping);
    }

    const typingChannel = supabase.channel(typingChannelName);
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
      void supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [conversationId, currentUserId]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!typingChannelRef.current || !currentUserId) return;
      void typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping },
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
      if (now - lastTypingSentTimeRef.current > 2000) {
        lastTypingSentTimeRef.current = now;
        sendTyping(true);
      }

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

  return {
    isPartnerTyping,
    sendTyping,
    clearPartnerTyping,
    handleComposerTextChange,
  };
}
