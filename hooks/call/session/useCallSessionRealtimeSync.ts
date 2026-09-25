import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { callRingtoneService } from '../../../lib/voip/callRingtoneService';
import type { CallPhase } from '../../../components/chat/CallModal';

export interface UseCallSessionRealtimeSyncParams {
  conversationId: string;
  activeSessionId: string | null;
  activeCallKind: 'audio' | 'video';
  setCallPhase: (phase: CallPhase) => void;
  setCallDuration: React.Dispatch<React.SetStateAction<number>>;
  durationTimerRef: React.MutableRefObject<any>;
  audioGov: {
    setupAudioForConnectedCall: (kind: 'audio' | 'video') => void;
  };
  handleRemoteHangup: () => void;
  onSessionAccepted?: () => void;
}

export function useCallSessionRealtimeSync(params: UseCallSessionRealtimeSyncParams) {
  const {
    conversationId,
    activeSessionId,
    activeCallKind,
    setCallPhase,
    setCallDuration,
    durationTimerRef,
    audioGov,
    handleRemoteHangup,
    onSessionAccepted,
  } = params;

  useEffect(() => {
    if (!conversationId) return;

    const callSyncChannelName = `call-session-sync-${conversationId}`;
    const existingSync = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${callSyncChannelName}`
    );
    if (existingSync) {
      void supabase.removeChannel(existingSync);
    }

    const channel = supabase
      .channel(callSyncChannelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_call_sessions',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const updated = payload.new;
          if (updated?.call_status === 'accepted') {
            callRingtoneService.stopAllRingtones();
            setCallPhase('connected');
            audioGov.setupAudioForConnectedCall(activeCallKind);
            if (!durationTimerRef.current) {
              durationTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
            }
            onSessionAccepted?.();
          } else if (updated?.call_status === 'ended' || updated?.call_status === 'declined') {
            handleRemoteHangup();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, activeSessionId, activeCallKind, audioGov, handleRemoteHangup, setCallPhase, setCallDuration, durationTimerRef]);
}
