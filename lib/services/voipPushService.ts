import { fetchWithAuth } from '../api-client';

export interface VoipCallPushParams {
  callId: string;
  conversationId: string;
  recipientUserIds: string[];
  callerId: string;
  callerName: string;
  callerAvatarUrl?: string | null;
  callKind: 'audio' | 'video';
}

export interface VoipCallCancelParams {
  callId: string;
  conversationId: string;
  recipientUserIds: string[];
  reason?: string;
}

/**
 * Service responsible for dispatching high-priority VoIP push notifications
 * (Apple PushKit APNs VoIP and Android High-Priority FCM Data messages)
 * to wake recipient devices even when locked or in battery saver mode.
 */
export async function dispatchVoipCallPush(params: VoipCallPushParams): Promise<void> {
  if (!params.recipientUserIds || params.recipientUserIds.length === 0) {
    return;
  }

  const payload = {
    type: 'voip_call_incoming',
    callId: params.callId,
    conversationId: params.conversationId,
    recipientUserIds: params.recipientUserIds,
    callerId: params.callerId,
    callerName: params.callerName || 'DeltanHub Member',
    callerAvatarUrl: params.callerAvatarUrl || null,
    callKind: params.callKind,
    priority: 'high',
    timeToLive: 30, // 30-second TTL to prevent ghost ringing after call is abandoned
    headers: {
      'apns-push-type': 'voip',
      'apns-priority': '10',
      'apns-expiration': '0',
    },
    android: {
      priority: 'high',
      ttl: 30,
    },
  };

  try {
    // Attempt dedicated calls push-dispatch endpoint, with graceful fallback to chats push-dispatch
    try {
      await fetchWithAuth('/api/chats/calls/push-dispatch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      await fetchWithAuth('/api/chats/push-dispatch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  } catch (err) {
    console.warn('[VoipPushService] Non-blocking VoIP call push dispatch notice:', err);
  }
}

/**
 * Dispatches a cancellation push to all recipient devices to immediately
 * tear down lock-screen ringing if the caller hangs up before answer.
 */
export async function dispatchVoipCallCancellation(params: VoipCallCancelParams): Promise<void> {
  if (!params.recipientUserIds || params.recipientUserIds.length === 0) {
    return;
  }

  const payload = {
    type: 'voip_call_cancelled',
    callId: params.callId,
    conversationId: params.conversationId,
    recipientUserIds: params.recipientUserIds,
    reason: params.reason || 'caller_hangup',
    priority: 'high',
    headers: {
      'apns-push-type': 'voip',
      'apns-priority': '10',
    },
  };

  try {
    try {
      await fetchWithAuth('/api/chats/calls/push-dispatch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      await fetchWithAuth('/api/chats/push-dispatch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  } catch (err) {
    console.warn('[VoipPushService] Non-blocking VoIP cancellation notice:', err);
  }
}
