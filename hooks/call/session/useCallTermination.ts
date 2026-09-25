import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from '../../../lib/haptics';
import { updateServerCallSession } from '../../../lib/webrtc-signaling';
import { callRepository } from '../../../lib/repositories';
import { callKit } from '../../../lib/voip/callkit';
import { connectionService } from '../../../lib/voip/connectionService';
import { callRingtoneService } from '../../../lib/voip/callRingtoneService';
import { dispatchVoipCallCancellation } from '../../../lib/services/voipPushService';
import { UseCallTerminationParams } from './types';

export function useCallTermination(params: UseCallTerminationParams) {
  const router = useRouter();
  const {
    conversationId,
    role,
    callPhase,
    setCallPhase,
    activeSessionId,
    currentUser,
    partnerUserId,
    activeCallKind,
    callDuration,
    durationTimerRef,
    ringTimeoutRef,
    audioGov,
    media,
    signaling,
  } = params;

  const handleRemoteHangup = useCallback(() => {
    callRingtoneService.stopAllRingtones();
    audioGov.cleanupAudio();
    media.cleanupMedia();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCallPhase('ended');
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    void callKit.endCall();
    if (activeSessionId) {
      void connectionService.dismissIncomingCallNotification(activeSessionId);
    }
    setTimeout(() => {
      router.back();
    }, 800);
  }, [activeSessionId, audioGov, media, router, setCallPhase, durationTimerRef]);

  const handleEndCall = useCallback(async () => {
    callRingtoneService.stopAllRingtones();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const prevPhase = callPhase;
    setCallPhase('ended');
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    audioGov.cleanupAudio();
    media.cleanupMedia();
    void callKit.endCall(activeSessionId || undefined);

    if (role === 'initiator' && prevPhase === 'outgoing' && partnerUserId && activeSessionId) {
      void dispatchVoipCallCancellation({
        callId: activeSessionId,
        conversationId,
        recipientUserIds: [partnerUserId],
        reason: 'caller_hangup',
      });
    }

    if (activeSessionId && currentUser && partnerUserId) {
      signaling.broadcastHangup();
      const finalAction = prevPhase === 'connected' ? 'end' : role === 'initiator' ? 'cancel' : 'missed';
      void updateServerCallSession(activeSessionId, finalAction === 'cancel' || finalAction === 'missed' ? 'missed' : 'end').catch(() => {});
      void callRepository.recordCallLogFallback({
        callId: activeSessionId,
        conversationId,
        actorUserId: currentUser.id,
        partnerUserId,
        callMode: activeCallKind === 'video' ? 'video' : 'audio',
        action: finalAction,
        durationSeconds: callDuration,
      }).catch(() => {});
      void callRepository.updateCallSession(activeSessionId, {
        callStatus: 'ended',
        endedAt: new Date().toISOString(),
        endedByUserId: currentUser.id,
        endReason: 'ended_by_user',
        durationSeconds: callDuration,
      });
    }

    setTimeout(() => {
      router.back();
    }, 600);
  }, [callPhase, activeSessionId, currentUser, partnerUserId, role, conversationId, activeCallKind, callDuration, audioGov, media, signaling, router, setCallPhase, durationTimerRef, ringTimeoutRef]);

  const handleDeclineCall = useCallback(async () => {
    callRingtoneService.stopAllRingtones();
    audioGov.cleanupAudio();
    media.cleanupMedia();
    setCallPhase('ended');
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    void callKit.endCall(activeSessionId || undefined);

    if (activeSessionId && currentUser && partnerUserId) {
      signaling.sendSignal('hangup', { reason: 'recipient_declined' });
      void updateServerCallSession(activeSessionId, 'decline').catch(() => {});
      void callRepository.recordCallLogFallback({
        callId: activeSessionId,
        conversationId,
        actorUserId: currentUser.id,
        partnerUserId,
        callMode: activeCallKind === 'video' ? 'video' : 'audio',
        action: 'decline',
        durationSeconds: 0,
      }).catch(() => {});
      void callRepository.updateCallSession(activeSessionId, {
        callStatus: 'declined',
        endedAt: new Date().toISOString(),
        endedByUserId: currentUser.id,
        endReason: 'recipient_declined',
      });
    }

    setTimeout(() => {
      router.back();
    }, 600);
  }, [activeSessionId, currentUser, partnerUserId, conversationId, activeCallKind, audioGov, media, signaling, router, setCallPhase, durationTimerRef, ringTimeoutRef]);

  return { handleRemoteHangup, handleEndCall, handleDeclineCall };
}
