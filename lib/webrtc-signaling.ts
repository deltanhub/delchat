import { fetchWithAuth } from './api-client';
import { RealtimeChannel } from '@supabase/supabase-js';

export type ChatCallSignalType = 'offer' | 'answer' | 'ice-candidate' | 'media-state' | 'hangup' | 'upgrade-to-video' | 'downgrade-to-audio';



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

const DEFAULT_STUN_SERVERS: ChatIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

let cachedIceConfig: {
  config: ChatCallIceConfig;
  expiresAt: number;
} | null = null;

/**
 * Fetch dynamic STUN/TURN configuration from DeltanHub production Cloudflare Calls edge.
 * Caches credentials to eliminate redundant network roundtrips during call setup.
 */
export async function fetchIceConfig(): Promise<ChatCallIceConfig> {
  const now = Date.now();
  if (cachedIceConfig && cachedIceConfig.expiresAt > now) {
    return cachedIceConfig.config;
  }

  try {
    const data = await fetchWithAuth('/api/chats/calls/ice');
    if (data?.iceServers && Array.isArray(data.iceServers)) {
      const config: ChatCallIceConfig = {
        iceServers: data.iceServers,
        ttlSeconds: data.ttlSeconds || 3600,
        relayConfigured: Boolean(data.relayConfigured),
      };

      cachedIceConfig = {
        config,
        expiresAt: now + (config.ttlSeconds ? config.ttlSeconds * 800 : 3600 * 1000),
      };

      return config;
    }
  } catch (err) {
    console.warn('[WebRTC Signaling] Failed to load remote ICE config, falling back to STUN:', err);
  }

  return {
    iceServers: DEFAULT_STUN_SERVERS,
    relayConfigured: false,
  };
}

/**
 * Start a call session on the DeltanHub server.
 * Creates the call session and initial participants, and logs `call_started` event.
 */
export async function startServerCallSession(
  conversationId: string,
  callMode: 'audio' | 'video'
): Promise<any> {
  return fetchWithAuth('/api/chats/calls', {
    method: 'POST',
    body: JSON.stringify({
      conversationId,
      callMode,
    }),
  });
}

/**
 * Update call session state (accept, decline, end, missed).
 * Automatically logs structured callLog in conversation messages when call ends.
 */
export async function updateServerCallSession(
  callId: string,
  action: 'accept' | 'decline' | 'end' | 'missed'
): Promise<any> {
  return fetchWithAuth(`/api/chats/calls/${encodeURIComponent(callId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      action,
    }),
  });
}

/**
 * Send a zero-DB-load Realtime Broadcast call signal to peer.
 */
export function sendLiveCallSignal(
  channel: RealtimeChannel | null,
  input: {
    callId: string;
    conversationId: string;
    senderUserId: string;
    recipientUserId: string;
    signalType: ChatCallSignalType;
    payload: Record<string, any>;
  }
): void {
  if (!channel) return;

  const signalId = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullPayload: ChatCallSignal = {
    id: signalId,
    callId: input.callId,
    conversationId: input.conversationId,
    senderUserId: input.senderUserId,
    recipientUserId: input.recipientUserId,
    signalType: input.signalType,
    payload: input.payload,
    createdAt: new Date().toISOString(),
  };

  void channel.send({
    type: 'broadcast',
    event: 'signal',
    payload: fullPayload,
  });
}
