import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ChatCallSignal,
  ChatCallSignalType,
  sendLiveCallSignal,
} from '../../../lib/webrtc-signaling';
import { SignalOutboxQueue } from './signalOutbox';
import { routeIncomingCallSignal } from './signalRouter';
import { UseCallSignalingOptions } from './types';

export function useCallSignalingChannel(options: UseCallSignalingOptions) {
  const { callId, conversationId, currentUserId, partnerUserId } = options;
  const [isChannelReady, setIsChannelReady] = useState(false);
  const channelRef = useRef<any>(null);
  const outboxQueueRef = useRef(new SignalOutboxQueue());
  const partnerUserIdRef = useRef(partnerUserId);
  partnerUserIdRef.current = partnerUserId;

  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  const sendSignal = useCallback(
    (signalType: ChatCallSignalType, payload: Record<string, any>) => {
      if (!callId || !currentUserId) {
        outboxQueueRef.current.push(signalType, payload);
        return;
      }
      const recipient = partnerUserIdRef.current || partnerUserId || '';
      if (!channelRef.current || !isChannelReady) {
        outboxQueueRef.current.push(signalType, payload);
        return;
      }

      sendLiveCallSignal(channelRef.current, {
        callId,
        conversationId,
        senderUserId: currentUserId,
        recipientUserId: recipient,
        signalType,
        payload,
      });
    },
    [callId, conversationId, currentUserId, partnerUserId, isChannelReady]
  );

  useEffect(() => {
    if (!callId || !currentUserId) {
      setIsChannelReady(false);
      return;
    }

    const liveChannelName = `chat-call-live:${callId}`;
    const existingLive = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${liveChannelName}` || (ch as any).subTopic === liveChannelName
    );
    if (existingLive) {
      void supabase.removeChannel(existingLive);
    }

    const liveChannel = supabase.channel(liveChannelName);
    channelRef.current = liveChannel;

    liveChannel
      .on('broadcast', { event: 'signal' }, (payload: any) => {
        const sig = payload?.payload as ChatCallSignal;
        routeIncomingCallSignal(sig, currentUserId, callbacksRef.current);
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setIsChannelReady(true);
          outboxQueueRef.current.flush(liveChannel, {
            callId,
            conversationId,
            senderUserId: currentUserId,
            recipientUserId: partnerUserIdRef.current || partnerUserId || '',
          });
        }
      });

    return () => {
      setIsChannelReady(false);
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [callId, currentUserId, conversationId]);

  return { isChannelReady, sendSignal };
}
