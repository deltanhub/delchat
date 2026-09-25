import { useCallback } from 'react';
import {
  UseCallSignalingOptions,
  UseCallSignalingReturn,
  useCallSignalingChannel,
} from './signaling';

export * from './signaling/types';

/**
 * Single-responsibility hook managing Supabase Realtime Broadcast signaling for VoIP.
 * Guarantees zero dropped packets by buffering in outboxQueueRef until status === 'SUBSCRIBED'.
 */
export function useCallSignaling(options: UseCallSignalingOptions): UseCallSignalingReturn {
  const { isChannelReady, sendSignal } = useCallSignalingChannel(options);

  const broadcastMediaState = useCallback(
    (isMuted: boolean, isVideoOff: boolean) => {
      sendSignal('media-state', { isMuted, isVideoOff });
    },
    [sendSignal]
  );

  const broadcastHangup = useCallback(() => {
    sendSignal('hangup', { reason: 'user_ended' });
  }, [sendSignal]);

  return {
    isChannelReady,
    sendSignal,
    broadcastMediaState,
    broadcastHangup,
  };
}
