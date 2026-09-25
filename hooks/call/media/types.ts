import {
  RTCIceCandidatePayload,
  RTCSessionDescriptionPayload,
} from '../../../lib/webrtc/mediaEngine';

export interface UseCallMediaOptions {
  onLocalCandidate?: (candidate: RTCIceCandidatePayload) => void;
  onIceRestartNeeded?: (offer: RTCSessionDescriptionPayload) => void;
}

export type ConnectionHealth = 'connected' | 'reconnecting' | 'failed';

export interface UseCallMediaReturn {
  localStream: any;
  remoteStream: any;
  connectionHealth: ConnectionHealth;
  isFrontCamera: boolean;
  initMedia: (kind: 'audio' | 'video') => Promise<any>;
  createOffer: () => Promise<RTCSessionDescriptionPayload | null>;
  handleOfferAndCreateAnswer: (sdp: string) => Promise<RTCSessionDescriptionPayload | null>;
  handleAnswer: (sdp: string) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidatePayload) => Promise<void>;
  switchCamera: () => Promise<void>;
  upgradeToVideo: () => Promise<any>;
  setMuted: (isMuted: boolean) => void;
  setVideoMuted: (isVideoMuted: boolean) => void;
  cleanupMedia: () => void;
}
