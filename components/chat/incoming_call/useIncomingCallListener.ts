import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import * as Haptics from '../../../lib/haptics';
import { callRingtoneService } from '../../../lib/voip/callRingtoneService';
import { connectionService } from '../../../lib/voip/connectionService';
import { IncomingCallData } from './types';
import {
  acceptCallSession, declineCallSession,
  declineCallBusy, fetchCallParticipantMetadata,
} from './incomingCallActions';
import { useIncomingCallAnimation } from './useIncomingCallAnimation';

export function useIncomingCallListener() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  const hapticIntervalRef = useRef<any>(null);
  const timeoutTimerRef = useRef<any>(null);
  const activeSessionChannelRef = useRef<any>(null);
  const activeCallIdRef = useRef<string | null>(null);
  const incomingCallRef = useRef<IncomingCallData | null>(null);
  incomingCallRef.current = incomingCall;

  const onDismissComplete = useCallback(() => setIncomingCall(null), []);
  const { startEnterAnimation, startExitAnimation, animatedContainerStyle, animatedRingStyle } =
    useIncomingCallAnimation(onDismissComplete);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => {
      void callRingtoneService.stopAllRingtones();
      subscription.unsubscribe();
    };
  }, []);

  const dismissHUD = useCallback(() => {
    void callRingtoneService.stopAllRingtones();
    if (activeCallIdRef.current) void connectionService.dismissIncomingCallNotification(activeCallIdRef.current);
    activeCallIdRef.current = null;
    incomingCallRef.current = null;
    if (hapticIntervalRef.current) { clearInterval(hapticIntervalRef.current); hapticIntervalRef.current = null; }
    if (timeoutTimerRef.current) { clearTimeout(timeoutTimerRef.current); timeoutTimerRef.current = null; }
    if (activeSessionChannelRef.current) { void supabase.removeChannel(activeSessionChannelRef.current); activeSessionChannelRef.current = null; }
    startExitAnimation();
    setTimeout(() => setIncomingCall(null), 300);
  }, [startExitAnimation]);

  const handleAccept = useCallback(async () => {
    if (!incomingCall || !currentUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const callSnapshot = { ...incomingCall };
    dismissHUD();
    await acceptCallSession(callSnapshot, currentUser.id, router);
  }, [incomingCall, currentUser, dismissHUD, router]);

  const handleDecline = useCallback(async () => {
    if (!incomingCall || !currentUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const callSnapshot = { ...incomingCall };
    dismissHUD();
    await declineCallSession(callSnapshot, currentUser.id);
  }, [incomingCall, currentUser, dismissHUD]);

  const presentIncomingCall = useCallback((callData: IncomingCallData) => {
    if (activeCallIdRef.current === callData.callId) return;
    if (activeCallIdRef.current !== null) {
      void declineCallBusy(callData.callId);
      return;
    }
    activeCallIdRef.current = callData.callId;
    incomingCallRef.current = callData;
    setIncomingCall(callData);
    void callRingtoneService.playIncomingRingtone();
    void connectionService.displayIncomingCallNotification({
      callId: callData.callId, conversationId: callData.conversationId,
      callerId: callData.callerUserId, callerName: callData.callerName,
      callerAvatarUrl: callData.callerAvatarUrl, callKind: callData.callMode,
    });
    startEnterAnimation();

    if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    hapticIntervalRef.current = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, 1600);

    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    timeoutTimerRef.current = setTimeout(() => dismissHUD(), 35000);

    if (activeSessionChannelRef.current) void supabase.removeChannel(activeSessionChannelRef.current);
    const syncChannelName = 'call-status-listener-' + callData.callId;
    const existingSync = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${syncChannelName}` || (ch as any).subTopic === syncChannelName
    );
    if (existingSync) void supabase.removeChannel(existingSync);
    activeSessionChannelRef.current = supabase.channel(syncChannelName)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_call_sessions', filter: 'id=eq.' + callData.callId }, (payload: any) => {
        const status = payload.new?.call_status;
        if (['ended', 'declined', 'missed', 'canceled'].includes(status)) dismissHUD();
      }).subscribe();
  }, [dismissHUD, startEnterAnimation]);

  useEffect(() => {
    if (!currentUser) return;
    const channelName = 'user-call-listener-' + currentUser.id;
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || (ch as any).subTopic === channelName
    );
    if (existing) void supabase.removeChannel(existing);

    const userCallChannel = supabase.channel(channelName)
      .on('broadcast', { event: 'incoming_call' }, async (payload: any) => {
        const callData = payload?.payload;
        if (!callData || callData.callerUserId === currentUser.id) return;
        presentIncomingCall(callData);
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_call_participants', filter: `user_id=eq.${currentUser.id}`,
      }, async (payload: any) => {
        const callData = await fetchCallParticipantMetadata(payload.new);
        if (callData) presentIncomingCall(callData);
      }).subscribe();

    return () => {
      void supabase.removeChannel(userCallChannel);
      dismissHUD();
    };
  }, [currentUser, dismissHUD, presentIncomingCall]);

  return {
    incomingCall, animatedContainerStyle, animatedRingStyle,
    handleAccept, handleDecline, dismissHUD, startEnterAnimation,
  };
}

export default useIncomingCallListener;
