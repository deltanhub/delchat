export type ChatCallSignalType =
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'media-state'
  | 'hangup'
  | 'upgrade-to-video'
  | 'downgrade-to-audio'
  | 'receiver-ready';

export interface ChatCallSignal {
  id: string;
  callId: string;
  conversationId: string;
  senderUserId: string;
  recipientUserId: string;
  signalType: ChatCallSignalType;
  payload: Record<string, any>;
  createdAt: string;
}

export interface MediaStatePayload {
  isMuted?: boolean;
  isVideoOff?: boolean;
  isFrontCamera?: boolean;
}

export interface IceCandidatePayload {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface SessionDescriptionPayload {
  type: 'offer' | 'answer';
  sdp: string;
}

export interface HangupPayload {
  reason?: string;
}

export interface ChatIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface ChatCallIceConfig {
  iceServers: ChatIceServer[];
  ttlSeconds?: number;
  relayConfigured?: boolean;
}
