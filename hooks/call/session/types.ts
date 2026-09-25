import type { CallPhase } from '../../../components/chat/CallModal';
import { AudioRoute } from '../../../lib/webrtc-audio';

export interface UseCallSessionParams {
  conversationId: string;
  kind?: 'audio' | 'video';
  role?: 'initiator' | 'receiver';
  initialCallId?: string;
  initialPartnerUserId?: string;
  initialPartnerName?: string;
  initialPartnerAvatarUrl?: string;
}

export interface CallPartnerInfo {
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  role: string | null;
}

export interface UseCallTerminationParams {
  conversationId: string;
  role: 'initiator' | 'receiver';
  callPhase: CallPhase;
  setCallPhase: (phase: CallPhase) => void;
  activeSessionId: string | null;
  currentUser: any;
  partnerUserId: string | null;
  activeCallKind: 'audio' | 'video';
  callDuration: number;
  durationTimerRef: React.MutableRefObject<any>;
  ringTimeoutRef: React.MutableRefObject<any>;
  audioGov: { cleanupAudio: () => void };
  media: { cleanupMedia: () => void };
  signaling: {
    sendSignal: (type: any, payload: Record<string, any>) => void;
    broadcastHangup: () => void;
  };
}

export interface UseCallControlsParams {
  conversationId: string;
  callPhase: CallPhase;
  setCallPhase: (phase: CallPhase) => void;
  activeCallKind: 'audio' | 'video';
  setActiveCallKind: (kind: 'audio' | 'video') => void;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  setIsVideoOff: React.Dispatch<React.SetStateAction<boolean>>;
  setCallDuration: React.Dispatch<React.SetStateAction<number>>;
  durationTimerRef: React.MutableRefObject<any>;
  activeSessionId: string | null;
  currentUser: any;
  partnerUserId: string | null;
  audioGov: {
    setupAudioForConnectedCall: (kind: 'audio' | 'video') => void;
    toggleSpeaker: () => void;
    selectAudioRoute: (route: AudioRoute) => void;
  };
  media: {
    setMuted: (muted: boolean) => void;
    setVideoMuted: (muted: boolean) => void;
    upgradeToVideo: () => Promise<any>;
  };
  signaling: {
    sendSignal: (type: any, payload: Record<string, any>) => void;
  };
}

export interface UseCallInitLifecycleParams {
  conversationId: string;
  kind: 'audio' | 'video';
  role: 'initiator' | 'receiver';
  activeSessionId: string | null;
  setCurrentUser: (u: any) => void;
  setPartnerUserId: (id: string | null) => void;
  setPartnerName: (name: string) => void;
  setPartnerAvatarUrl: (url: string | null) => void;
  setPartnerRole: (role: string | null) => void;
  setCallPhase: (phase: CallPhase) => void;
  setActiveSessionId: (id: string | null) => void;
  setCallDuration: React.Dispatch<React.SetStateAction<number>>;
  durationTimerRef: React.MutableRefObject<any>;
  ringTimeoutRef: React.MutableRefObject<any>;
  audioGov: {
    setupAudioForConnectedCall: (kind: 'audio' | 'video') => void;
    cleanupAudio: () => void;
  };
  media: {
    initMedia: (kind: 'audio' | 'video') => Promise<any>;
    createOffer: () => Promise<any>;
    cleanupMedia: () => void;
  };
  signaling: {
    sendSignal: (type: any, payload: Record<string, any>) => void;
  };
  handleEndCall: () => void;
}
