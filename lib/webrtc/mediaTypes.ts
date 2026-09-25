import { ChatIceServer } from '../webrtc-signaling';

export interface RTCIceCandidatePayload {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface RTCSessionDescriptionPayload {
  type: 'offer' | 'answer';
  sdp: string;
}

export interface MediaAcquisitionOptions {
  audio?: boolean;
  video?: boolean;
  facingMode?: 'user' | 'environment';
}

export type WebRTCConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export interface MediaEngineConfig {
  iceServers: ChatIceServer[];
  onLocalIceCandidate?: (candidate: RTCIceCandidatePayload) => void;
  onRemoteStream?: (stream: any) => void;
  onConnectionStateChange?: (state: string) => void;
  onIceGatheringStateChange?: (state: string) => void;
  onIceRestartNeeded?: (offer: RTCSessionDescriptionPayload) => void;
}
