import { useCallback } from 'react';
import * as Haptics from '../../../lib/haptics';
import { sendLiveCallSignal } from '../../../lib/webrtc-signaling';
import { AudioRoute } from '../../../lib/webrtc-audio';
import { callRepository } from '../../../lib/repositories';
import { callKit } from '../../../lib/voip/callkit';
import { proximityService } from '../../../lib/voip/proximityService';
import { callRingtoneService } from '../../../lib/voip/callRingtoneService';
import { UseCallControlsParams } from './types';

export function useCallControls(params: UseCallControlsParams) {
  const {
    conversationId,
    callPhase,
    setCallPhase,
    activeCallKind,
    setActiveCallKind,
    setIsMuted,
    setIsVideoOff,
    setCallDuration,
    durationTimerRef,
    activeSessionId,
    currentUser,
    partnerUserId,
    audioGov,
    media,
    signaling,
  } = params;

  const handleAcceptCall = useCallback(async () => {
    callRingtoneService.stopAllRingtones();
    setCallPhase('connected');
    audioGov.setupAudioForConnectedCall(activeCallKind);
    if (!durationTimerRef.current) {
      durationTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
  }, [activeCallKind, audioGov, setCallPhase, setCallDuration, durationTimerRef]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      void callKit.setMuted(next);
      media.setMuted(next);
      return next;
    });
  }, [media, setIsMuted]);

  const handleToggleSpeaker = useCallback(() => {
    audioGov.toggleSpeaker();
  }, [audioGov]);

  const handleSetAudioRoute = useCallback((route: AudioRoute) => {
    audioGov.selectAudioRoute(route);
    if (route === 'earpiece' && callPhase === 'connected' && activeCallKind === 'audio') {
      proximityService.enableProximity();
    } else {
      proximityService.disableProximity();
    }
  }, [audioGov, callPhase, activeCallKind]);

  const handleRestartIce = useCallback(async () => {
    signaling.sendSignal('offer', { isIceRestart: true });
  }, [signaling]);

  const handleUpgradeToVideo = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActiveCallKind('video');
    setIsVideoOff(false);
    await media.upgradeToVideo();
    if (activeSessionId && currentUser && partnerUserId) {
      signaling.sendSignal('upgrade-to-video', { requestedBy: currentUser.id });
      sendLiveCallSignal(null, {
        callId: activeSessionId,
        conversationId,
        senderUserId: currentUser.id,
        recipientUserId: partnerUserId,
        signalType: 'upgrade-to-video',
        payload: { requestedBy: currentUser.id },
      });
      void callRepository.updateCallSession(activeSessionId, { callMode: 'video' });
    }
  }, [media, activeSessionId, currentUser, partnerUserId, conversationId, signaling, setActiveCallKind, setIsVideoOff]);

  const handleToggleVideo = useCallback(async () => {
    if (activeCallKind === 'audio') {
      await handleUpgradeToVideo();
    } else {
      setIsVideoOff((v) => {
        const next = !v;
        media.setVideoMuted(next);
        return next;
      });
    }
  }, [activeCallKind, handleUpgradeToVideo, media, setIsVideoOff]);

  return {
    handleAcceptCall,
    handleToggleMute,
    handleToggleSpeaker,
    handleSetAudioRoute,
    handleRestartIce,
    handleUpgradeToVideo,
    handleToggleVideo,
  };
}
