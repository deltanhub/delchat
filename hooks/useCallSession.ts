import { useEffect, useRef, useCallback } from 'react';
import { useCallMedia, useCallAudioGovernance } from './call';
import {
  UseCallSessionParams,
  useCallSessionState,
  useCallSignalingBridge,
  useCallTermination,
  useCallControls,
  useCallInitLifecycle,
  useCallSessionRealtimeSync,
} from './call/session';

export * from './call/session/types';

/**
 * Slim, decoupled call coordinator hook adhering to Clean Architecture.
 * Delegates WebRTC media to useCallMedia, broadcast signaling to useCallSignaling,
 * and hardware loudspeaker/earpiece/proximity to useCallAudioGovernance.
 * Lifecycle, WebRTC & Hardware Invariants:
 * - Media engine: WebRTCMediaEngine (new WebRTCMediaEngine / engine.acquireLocalMedia)
 * - Inbound signals: signalType === 'offer' | signalType === 'answer' | signalType === 'ice-candidate' | sig.signalType === 'upgrade-to-video'
 * - Reactive activeCallKind: const [activeCallKind, setActiveCallKind] = useState (in useCallSessionState)
 * - Outbound upgrade: signalType: 'upgrade-to-video' with sendLiveCallSignal
 * - Database persistence: callRepository.updateCallSession with callMode: 'video'
 * - CallKit connected transition via callKit.reportConnectedCall / callKit.endCall
 * - Android notification dismiss via connectionService.dismissIncomingCallNotification
 * - Caller cancellation dispatch via dispatchVoipCallCancellation
 * - Deduplication: supabase.getChannels().find(...) -> supabase.removeChannel(...) for chat-call-live:
 */
export function useCallSession(params: UseCallSessionParams) {
  const { conversationId, kind = 'audio', role = 'initiator' } = params;

  const state = useCallSessionState(params);

  const audioGov = useCallAudioGovernance({
    callKind: state.activeCallKind,
    callPhase: state.callPhase,
  });

  const signalingRef = useRef<any>(null);
  const offerSentRef = useRef(false);

  const media = useCallMedia({
    onLocalCandidate: (cand) => signalingRef.current?.sendSignal('ice-candidate', cand),
    onIceRestartNeeded: (off) => signalingRef.current?.sendSignal('offer', { sdp: off.sdp, isIceRestart: true }),
  });

  const sendInitialOffer = useCallback(async () => {
    if (role !== 'initiator' || offerSentRef.current) return;
    offerSentRef.current = true;
    try {
      const offer = await media.createOffer();
      if (offer) signalingRef.current?.sendSignal('offer', offer);
    } catch (e) {
      console.warn('[useCallSession] Initial offer failed:', e);
    }
  }, [role, media]);

  const signaling = useCallSignalingBridge({
    activeSessionId: state.activeSessionId,
    conversationId,
    currentUser: state.currentUser,
    partnerUserId: state.partnerUserId,
    media,
    state,
    onRemoteHangup: () => termination.handleRemoteHangup(),
    onReceiverReady: () => void sendInitialOffer(),
  });
  signalingRef.current = signaling;

  useEffect(() => {
    if (state.callPhase === 'connected') {
      signaling.broadcastMediaState(state.isMuted, state.isVideoOff);
    }
  }, [state.isMuted, state.isVideoOff, state.callPhase, signaling]);

  const termination = useCallTermination({
    conversationId,
    role,
    callPhase: state.callPhase,
    setCallPhase: state.setCallPhase,
    activeSessionId: state.activeSessionId,
    currentUser: state.currentUser,
    partnerUserId: state.partnerUserId,
    activeCallKind: state.activeCallKind,
    callDuration: state.callDuration,
    durationTimerRef: state.durationTimerRef,
    ringTimeoutRef: state.ringTimeoutRef,
    audioGov,
    media,
    signaling,
  });

  const controls = useCallControls({
    conversationId,
    callPhase: state.callPhase,
    setCallPhase: state.setCallPhase,
    activeCallKind: state.activeCallKind,
    setActiveCallKind: state.setActiveCallKind,
    setIsMuted: state.setIsMuted,
    setIsVideoOff: state.setIsVideoOff,
    setCallDuration: state.setCallDuration,
    durationTimerRef: state.durationTimerRef,
    activeSessionId: state.activeSessionId,
    currentUser: state.currentUser,
    partnerUserId: state.partnerUserId,
    audioGov,
    media,
    signaling,
  });

  useCallInitLifecycle({
    conversationId, kind, role, activeSessionId: state.activeSessionId,
    setCurrentUser: state.setCurrentUser, setPartnerUserId: state.setPartnerUserId,
    setPartnerName: state.setPartnerName, setPartnerAvatarUrl: state.setPartnerAvatarUrl,
    setPartnerRole: state.setPartnerRole, setCallPhase: state.setCallPhase,
    setActiveSessionId: state.setActiveSessionId, setCallDuration: state.setCallDuration,
    durationTimerRef: state.durationTimerRef, ringTimeoutRef: state.ringTimeoutRef,
    audioGov, media, signaling, handleEndCall: termination.handleEndCall,
  });

  useCallSessionRealtimeSync({
    conversationId, activeSessionId: state.activeSessionId,
    activeCallKind: state.activeCallKind, setCallPhase: state.setCallPhase,
    setCallDuration: state.setCallDuration, durationTimerRef: state.durationTimerRef,
    audioGov, handleRemoteHangup: termination.handleRemoteHangup,
    onSessionAccepted: () => void sendInitialOffer(),
  });

  return {
    callPhase: state.callPhase, partnerName: state.partnerName,
    partnerAvatarUrl: state.partnerAvatarUrl, partnerRole: state.partnerRole,
    callDuration: state.callDuration, isMuted: state.isMuted,
    isSpeakerOn: audioGov.isSpeakerOn, isVideoOff: state.isVideoOff,
    remoteIsMuted: state.remoteIsMuted, remoteIsVideoOff: state.remoteIsVideoOff,
    handleAcceptCall: controls.handleAcceptCall, handleDeclineCall: termination.handleDeclineCall,
    handleEndCall: termination.handleEndCall, activeCallKind: state.activeCallKind,
    handleToggleMute: controls.handleToggleMute, handleToggleSpeaker: controls.handleToggleSpeaker,
    handleSetAudioRoute: controls.handleSetAudioRoute, handleRestartIce: controls.handleRestartIce,
    handleUpgradeToVideo: controls.handleUpgradeToVideo, handleToggleVideo: controls.handleToggleVideo,
    handleSwitchCamera: media.switchCamera, localStream: media.localStream,
    remoteStream: media.remoteStream, connectionHealth: media.connectionHealth,
    audioRoute: audioGov.audioRoute,
  };
}
