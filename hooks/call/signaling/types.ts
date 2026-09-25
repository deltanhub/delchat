import { ChatCallSignalType } from '../../../lib/webrtc-signaling';

export interface UseCallSignalingOptions {
  callId: string | null;
  conversationId: string;
  currentUserId: string | null;
  partnerUserId: string | null;
  onOffer?: (sdp: string, isIceRestart?: boolean) => void;
  onAnswer?: (sdp: string) => void;
  onIceCandidate?: (candidate: any) => void;
  onHangup?: (reason?: string) => void;
  onMediaState?: (state: { isMuted?: boolean; isVideoOff?: boolean }) => void;
  onUpgradeToVideo?: () => void;
  onDowngradeToAudio?: () => void;
  onReceiverReady?: () => void;
}

export interface UseCallSignalingReturn {
  isChannelReady: boolean;
  sendSignal: (signalType: ChatCallSignalType, payload: Record<string, any>) => void;
  broadcastMediaState: (isMuted: boolean, isVideoOff: boolean) => void;
  broadcastHangup: () => void;
}

export interface QueuedSignal {
  signalType: ChatCallSignalType;
  payload: Record<string, any>;
}
