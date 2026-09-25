import { useCallSignaling } from '../useCallSignaling';

export interface UseCallSignalingBridgeParams {
  activeSessionId: string | null;
  conversationId: string;
  currentUser: any;
  partnerUserId: string | null;
  media: {
    handleOfferAndCreateAnswer: (sdp: string) => Promise<any>;
    handleAnswer: (sdp: string) => Promise<void>;
    addIceCandidate: (candidate: any) => Promise<void>;
    upgradeToVideo: () => Promise<any>;
  };
  state: {
    setRemoteIsMuted: (muted: boolean) => void;
    setRemoteIsVideoOff: (videoOff: boolean) => void;
    setActiveCallKind: (kind: 'audio' | 'video') => void;
    setIsVideoOff: (videoOff: boolean) => void;
  };
  onRemoteHangup: () => void;
  onReceiverReady?: () => void;
}

export function useCallSignalingBridge(params: UseCallSignalingBridgeParams) {
  const {
    activeSessionId,
    conversationId,
    currentUser,
    partnerUserId,
    media,
    state,
    onRemoteHangup,
  } = params;

  const signaling = useCallSignaling({
    callId: activeSessionId,
    conversationId,
    currentUserId: currentUser?.id ?? null,
    partnerUserId,
    onOffer: async (sdp) => {
      const answer = await media.handleOfferAndCreateAnswer(sdp);
      if (answer) signaling.sendSignal('answer', answer);
    },
    onAnswer: async (sdp) => {
      await media.handleAnswer(sdp);
    },
    onIceCandidate: async (cand) => {
      await media.addIceCandidate(cand);
    },
    onHangup: () => {
      onRemoteHangup();
    },
    onMediaState: (ms) => {
      if (typeof ms.isMuted === 'boolean') state.setRemoteIsMuted(ms.isMuted);
      if (typeof ms.isVideoOff === 'boolean') state.setRemoteIsVideoOff(ms.isVideoOff);
    },
    onUpgradeToVideo: async () => {
      state.setActiveCallKind('video');
      state.setIsVideoOff(false);
      await media.upgradeToVideo();
    },
    onDowngradeToAudio: () => {
      state.setActiveCallKind('audio');
    },
    onReceiverReady: () => {
      params.onReceiverReady?.();
    },
  });

  return signaling;
}
